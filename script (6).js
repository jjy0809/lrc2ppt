const appData = {
    currentStep: 1,
    totalSteps: 3,
    lyrics: [],
    options: {
        fileName: '가사 피피티',
        fontSize: 60,
        fontColor: [0,0,0],
        bgColor: [255,255,255],
        bgImage: null,
        lineMode: 'double',
        autoWrap: true,
        fontFace: '맑은 고딕',
        splitPreference: 'back',
        horizontalAlign: 'center',
        verticalAlign: 'middle',
        bold: true,
        italic: false,
        removeEmptyLines: false,
        sanitizeText: true,
        title: {
            enable: false,
            text: '',
            hPosition: 'center',
            vPosition: 'top',
            fontSize: 30,
            color: [0,0,0]
        }
    }
};

let captchaToken = '';

function updateProgress() {
    const progress = ((appData.currentStep - 1) / (appData.totalSteps - 1)) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

function showStep(step) {
    if (appData.currentStep === 2) {
        const preview = document.getElementById('lyricsPreview');
        appData.lyrics = preview.value.split('\n');
    }

    appData.currentStep = step;
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    updateButtonState();
    updateIframe(step);

    if (step === 2) {
        const preview = document.getElementById('lyricsPreview');
        preview.value = appData.lyrics.join('\n');
        preview.dispatchEvent(new Event('input'));
    }

    updateProgress();
    if (step === 3) {
        captchaToken = ''; 
        document.getElementById('finalGenerateBtn').disabled = true; 
        document.getElementById('fileName').value = document.getElementById('songTitle').value.trim() || '';
        hcaptcha.reset(); 
        updateImageDeleteButton();
        loadOptionsFromStorage();
    }

    if (step === 4) {
        captchaToken = ''; 
        document.getElementById('finalGenerateBtn').disabled = true; 
        hcaptcha.reset(); 
        saveOptions();
    }
}

function updateIframe (step) {
    const iframe = document.getElementById('help-iframe');
    if (step === 1) { 
        iframe.src = "https://reflective-tiglon-21b.notion.site/ebd/1b54c5931bb280e99ceef4f362c701db";
    }
    if (step === 2) { 
        iframe.src = "https://reflective-tiglon-21b.notion.site/ebd/1b54c5931bb2803eb212e8beb83a55e9";
    }
    if (step === 3) { 
        iframe.src = "https://reflective-tiglon-21b.notion.site/ebd/1c14c5931bb280e8892bfa6c30e6bf36";
    }
}


function resetForm() {
    location.reload();
}


const getOrCreateUUID = () => {
    const cookies = document.cookie.split('; ');
    const uuidCookie = cookies.find(cookie => cookie.startsWith('uuid='));

    if (!crypto.randomUUID) {
        crypto.randomUUID = function() {
            return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        };
    }
    
    if (uuidCookie) {
        return uuidCookie.split('=')[1];
    } else {
        const newUUID = crypto.randomUUID();
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString(); 
        document.cookie = `uuid=${newUUID}; expires=${expires}; path=/`;
        return newUUID;
    }
};


async function searchLyrics() {
    const searchBtn = document.querySelector('#linkOption .icon-button');
    const spinner = searchBtn.querySelector('.loading-spinner');
    const title = document.getElementById('songTitle').value.trim();
    const artist = document.getElementById('artistName').value.trim();


    if (!title) {
        alert('❗곡 제목을 입력해주세요');
        return;
    }

    searchBtn.disabled = true;
    spinner.style.display = 'block';

    try {
        const uuid = getOrCreateUUID(); 
        
        const apiUrl = `https://hrrt5dbju7tmd2j5loseysgsce0drhqd.lambda-url.ap-northeast-2.on.aws/?${new URLSearchParams({
            title: title,
            artist: artist,
            id: uuid 
        })}`;

        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'application/json' }
        });

        const data = await response.json();

        if (!response.ok) throw new Error(`${data.error} (${response.status})`);
    
        
        if (!data?.lyrics) throw new Error('가사 데이터를 찾을 수 없습니다');
        
        appData.lyrics = data.lyrics.split('\n');
        showStep(2);
    } catch (error) {
        console.error('가사 검색 오류:', error);
        alert(`❗ ${error.message}`);
    } finally {
        spinner.style.display = 'none';
        updateSearchButton();
    }
}

async function searchLyrics2() {
    const searchBtn = document.querySelector('#linkOption2 .icon-button');
    const spinner = searchBtn.querySelector('.loading-spinner');
    const title = document.getElementById('songTitle2').value.trim();
    const artist = document.getElementById('artistName2').value.trim();
    const textarea = document.getElementById('lyricsPreview');

    searchBtn.disabled = true;
    spinner.style.display = 'block';
    
    try {
    const uuid = getOrCreateUUID();
    const apiUrl = `https://hrrt5dbju7tmd2j5loseysgsce0drhqd.lambda-url.ap-northeast-2.on.aws/?${new URLSearchParams({
        title: title,
        artist: artist,
        id: uuid
    })}`;

    const response = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } });
    const data = await response.json();
    
    if (!response.ok) throw new Error(`${data.error} (${response.status})`);
    if (!data?.lyrics) throw new Error('가사 데이터를 찾을 수 없습니다');

    textarea.value = [textarea.value, data.lyrics].filter(Boolean).join('\n\n');
    textarea.dispatchEvent(new Event('input')); 

    document.getElementById('songTitle2').value = '';
    document.getElementById('artistName2').value = '';

    } catch (error) {
    console.error('가사 검색 오류:', error);
    alert(`❗ ${error.message}`);
    } finally {
    spinner.style.display = 'none';
    searchBtn.disabled = !title.trim();
    }
}


function updateSearchButton() {
    const title1 = document.getElementById('songTitle')?.value;
    const title2 = document.getElementById('songTitle2')?.value;
    const searchBtn1 = document.querySelector('#linkOption .icon-button');
    const searchBtn2 = document.querySelector('#linkOption2 .icon-button');

    if(searchBtn1) searchBtn1.disabled = !(title1?.trim());
    if(searchBtn2) searchBtn2.disabled = !(title2?.trim());
}

function processLyrics() {
    const textarea = document.querySelector('#lyricsOption textarea');
    const includeEmpty = document.getElementById('emptyLineSwitch').checked;
    appData.lyrics = includeEmpty 
        ? textarea.value.split('\n').map(line => line.trim())
        : textarea.value.split('\n').filter(line => line.trim() !== '').map(line => line.trim());
    showStep(2);
}

async function generatePresentation(options) {
    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';

    if (options.bgImage) {
        const reader = new FileReader();
        await new Promise((resolve) => {
            reader.onload = () => {
                pres.defineSlideMaster({ 
                    title: 'MASTER_SLIDE',
                    background: { 
                        data: reader.result,
                        style: { fill: { type: 'tile' } }
                    }
                });
                resolve();
            };
            reader.readAsDataURL(options.bgImage);
        });
    } else {
        pres.defineSlideMaster({ 
            title: 'MASTER_SLIDE',
            background: { color: rgbToHex(options.bgColor) }
        });
    }

    try {
        const uuid = getOrCreateUUID();
        const apiUrl = 'https://ra3dezxhtqjnof564iaq4awbyq0sqmlb.lambda-url.ap-northeast-2.on.aws/';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json' 
            },
            body: JSON.stringify({
                captchaToken: captchaToken || 'test',
                pptOptions: options,
                lyrics: appData.lyrics,
                uuid: uuid,
                emptySlides: document.getElementById('includeEmptySlides').checked
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '서버 오류가 발생했습니다.');
        }

        const processedLyrics = data.lyrics;

        processedLyrics.forEach(text => {
            const slide = pres.addSlide({ masterName: 'MASTER_SLIDE' });

            const maxLines = options.lineMode === 'double' ? 2 : (options.autoWrap ? 2 : 1);

            if (text.trim() !== '' || !options.removeEmptyLines) {
                slide.addText(text, {
                    w: '100%', h: '100%',
                    align: options.horizontalAlign,
                    valign: options.verticalAlign,
                    fontSize: options.fontSize,
                    bold: options.bold,
                    italic: options.italic,
                    lineSpacingMultiple: 1.3,
                    color: rgbToHex(options.fontColor),
                    fontFace: options.fontFace,
                    autoFit: { 
                        shrinkText: true,
                        maxLines: maxLines
                    }
                });
            }

            if (options.title.enable && options.title.text) {
                let xPos;
                const slideWidth = 13.33;
                
                switch (options.title.hPosition) {
                    case 'left': xPos = 0.5; break;
                    case 'right': xPos = slideWidth - 3.5; break;
                    default: xPos = (slideWidth - 5) / 2;
                }
                
                const yPos = options.title.vPosition === 'top' ? 0.3 : 6.5;
                
                slide.addText(options.title.text, {
                    x: xPos,
                    y: yPos,
                    w: 5,
                    h: 0.6,
                    fontSize: options.title.fontSize,
                    bold: true,
                    color: rgbToHex(options.title.color),
                    align: options.title.hPosition === 'center' ? 'center' : 'left',
                    fontFace: options.fontFace
                });
            }
        });
        hcaptcha.reset();
        captchaToken = '';
        document.getElementById('finalGenerateBtn').disabled = true;
        return await pres.write({ outputType: 'base64' });
    } catch (error) {
        console.error('PPT 생성 오류:', error);
        if (error.message.includes('캡챠 검증 실패')) {
            alert('❗ 캡챠 인증에 실패했습니다. 다시 시도해주세요.');
        } else if (error.message.includes('너무 자주 요청')) {
            alert('❗ 요청이 너무 빈번합니다. 잠시 후 다시 시도해주세요.');
        } else {
            alert(`❗ PPT 생성 중 오류가 발생했습니다: ${error.message}`);
        }
        throw error;
    }
}



const rgbToHex = rgb => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
const hexToRgb = hex => hex.replace('#','').match(/.{2}/g).map(v => parseInt(v, 16));

function enableGenerateBtn(token) {
    captchaToken = token;
    document.getElementById('finalGenerateBtn').disabled = false;
}

async function generateFinalPPT() {
    const generateBtn = document.getElementById('finalGenerateBtn');
    const loadingSpinner = generateBtn.querySelector('.loading-spinner');
    
    generateBtn.disabled = true;
    loadingSpinner.style.display = 'block';

    saveOptions();
    
    try {
        appData.options = {
            ...appData.options,
            fileName: document.getElementById('fileName').value || '가사 피피티',
            fontSize: parseInt(document.getElementById('fontSize').value) || 60,
            fontColor: hexToRgb(document.getElementById('fontColor').value) || [0,0,0],
            bgColor: hexToRgb(document.getElementById('bgColor').value) || [255,255,255],
            bgImage: document.getElementById('bgImage').files[0] || null,
            fontFace: document.getElementById('fontFace').value || 'Malgun Gothic',
            lineMode: document.getElementById('lineMode').value || 'double',
            autoWrap: document.getElementById('autoWrap').checked ?? true,
            bold: document.getElementById('boldOption').checked ?? true,
            italic: document.getElementById('italicOption').checked ?? false,
            optionSave: document.getElementById('optionSave').checked ?? true,
            removeEmptyLines: !(document.getElementById('includeEmptySlides').checked ?? true),
            title: {
                enable: document.getElementById('titleEnable').checked ?? false,
                text: document.getElementById('titleText').value || '',
                hPosition: document.getElementById('titleHPosition').value || 'center',
                vPosition: document.getElementById('titleVPosition').value || 'top',
                fontSize: parseInt(document.getElementById('titleFontSize').value) || 30,
                color: hexToRgb(document.getElementById('titleColor').value) || [0,0,0]
            }
        };

        

        const pptBase64 = await generatePresentation(appData.options);
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${pptBase64}`;
        link.download = appData.options.fileName + ".pptx";
        link.click();
    } catch (error) {
        alert(`❗ PPT 생성 오류 - ${error.message}`);
        console.error(error);
    } finally {
        generateBtn.disabled = false;
        loadingSpinner.style.display = 'none';
    }
}

function loadOptionsFromStorage() {
    const savedOptions = localStorage.getItem('pptOptions');
    if (!savedOptions) return;

    const options = JSON.parse(savedOptions);
    document.getElementById('bgColor').value = rgbToHex(options.bgColor);
    document.getElementById('fontColor').value = rgbToHex(options.fontColor);
    document.getElementById('lineMode').value = options.lineMode;
    document.getElementById('fontFace').value = options.fontFace;
    document.getElementById('fontSize').value = options.fontSize;
    document.getElementById('autoWrap').checked = options.autoWrap;
    document.getElementById('boldOption').checked = options.bold;
    document.getElementById('italicOption').checked = options.italic;
    document.getElementById('includeEmptySlides').checked = !options.removeEmptyLines;
    document.getElementById('titleEnable').checked = options.title.enable;
    document.getElementById('titleHPosition').value = options.title.hPosition;
    document.getElementById('titleText').value = options.title.text;
    document.getElementById('titleVPosition').value = options.title.vPosition;
    document.getElementById('titleFontSize').value = options.title.fontSize;
    document.getElementById('titleColor').value = rgbToHex(options.title.color);
    
    if(options.bgImage) {
        const blob = dataURItoBlob(options.bgImage);
        const file = new File([blob], "background.jpg", {type: "image/jpeg"});
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        document.getElementById('bgImage').files = dataTransfer.files;
        document.getElementById('removeImg-button').disabled = false;
    }
}

function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: mimeString});
}

function removeBackgroundImage() {
    document.getElementById('bgImage').value = '';
    document.getElementById('removeImg-button').disabled = true;
    const savedOptions = localStorage.getItem('pptOptions');
    if (savedOptions) {
        const options = JSON.parse(savedOptions);
        delete options.bgImage;
        localStorage.setItem('pptOptions', JSON.stringify(options));
    }
}

function updateStep2Button() {
    const lyrics = document.getElementById('lyricsPreview').value;
    document.getElementById('step2NextBtn').disabled = !lyrics.trim();
}

function updateButtonState() {
    const textarea = document.querySelector('#lyricsOption textarea');
    const button = document.querySelector('#lyricsOption .icon-button');
    const lines = textarea.value.split('\n');
    const isValid = lines.filter(line => line.trim() !== '').length >= 1;
    button.disabled = !isValid;
}

function updateImageDeleteButton() {
    const hasImage = !!document.getElementById('bgImage').files[0];
    document.getElementById('removeImg-button').disabled = !hasImage;
}

async function saveOptions() {
    appData.options = {
        ...appData.options,
        fileName: document.getElementById('fileName').value || '가사 피피티',
        fontSize: parseInt(document.getElementById('fontSize').value) || 60,
        fontColor: hexToRgb(document.getElementById('fontColor').value) || [0,0,0],
        bgColor: hexToRgb(document.getElementById('bgColor').value) || [255,255,255],
        bgImage: document.getElementById('bgImage').files[0] || null,
        fontFace: document.getElementById('fontFace').value || 'Malgun Gothic',
        lineMode: document.getElementById('lineMode').value || 'double',
        autoWrap: document.getElementById('autoWrap').checked ?? true,
        bold: document.getElementById('boldOption').checked ?? true,
        italic: document.getElementById('italicOption').checked ?? false,
        optionSave: document.getElementById('optionSave').checked ?? true,
        removeEmptyLines: !(document.getElementById('includeEmptySlides').checked ?? true),
        title: {
            enable: document.getElementById('titleEnable').checked ?? false,
            text: document.getElementById('titleText').value || '',
            hPosition: document.getElementById('titleHPosition').value || 'center',
            vPosition: document.getElementById('titleVPosition').value || 'top',
            fontSize: parseInt(document.getElementById('titleFontSize').value) || 30,
            color: hexToRgb(document.getElementById('titleColor').value) || [0,0,0]
        }
    };
    if (appData.options.optionSave) {
        const optionsToSave = { ...appData.options };
        delete optionsToSave.fileName;
        
        if(optionsToSave.bgImage) {
            const reader = new FileReader();
            await new Promise(resolve => {
                reader.onload = function() {
                    optionsToSave.bgImage = reader.result;
                    localStorage.setItem('pptOptions', JSON.stringify(optionsToSave));
                    resolve();
                };
                reader.readAsDataURL(optionsToSave.bgImage);
            });
        } else {
            localStorage.setItem('pptOptions', JSON.stringify(optionsToSave));
        }
    } else {
        localStorage.removeItem('pptOptions');
    }
}

document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', function(e) {
        if (e.target.closest('.input-field, .icon-button, .switch')) return;
        const prevActive = document.querySelector('.option-card.active');
        const inputContainer = this.querySelector('.input-container');
        if (prevActive) {
            prevActive.classList.remove('active');
            prevActive.querySelector('.input-container').style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        requestAnimationFrame(() => {
            if (prevActive !== this) {
                this.classList.add('active');
                inputContainer.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                this.querySelector('.input-field').focus();
            }
        });
    });
});

function resetSettings() {
    localStorage.removeItem('pptOptions');
    removeBackgroundImage();
    const options = appData.options;
    document.getElementById('bgColor').value = rgbToHex(options.bgColor);
    document.getElementById('fontColor').value = rgbToHex(options.fontColor);
    document.getElementById('lineMode').value = options.lineMode;
    document.getElementById('fontFace').value = options.fontFace;
    document.getElementById('fontSize').value = options.fontSize;
    document.getElementById('autoWrap').checked = options.autoWrap;
    document.getElementById('boldOption').checked = options.bold;
    document.getElementById('italicOption').checked = options.italic;
    document.getElementById('includeEmptySlides').checked = !options.removeEmptyLines;
    document.getElementById('titleEnable').checked = options.title.enable;
    document.getElementById('titleHPosition').value = options.title.hPosition;
    document.getElementById('titleText').value = options.title.text;
    document.getElementById('titleVPosition').value = options.title.vPosition;
    document.getElementById('titleFontSize').value = options.title.fontSize;
    document.getElementById('titleColor').value = rgbToHex(options.title.color);
}

document.querySelectorAll('input, select, textarea').forEach(element => {
    element.addEventListener('change', () => {
        if (appData.currentStep === 3 && appData.options.optionSave) {
            const optionsToSave = { ...appData.options };
            delete optionsToSave.fileName;
            localStorage.setItem('pptOptions', JSON.stringify(optionsToSave));
        }
    });
});


document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const activeStep = document.querySelector('.step.active');
        const activeTextarea = document.activeElement.tagName === 'TEXTAREA';
        
        if (!activeTextarea) {
            if (appData.currentStep === 1) {
                const lyricsCard = document.getElementById('lyricsOption');
                const searchCard = document.getElementById('linkOption');
                const lyricsTextarea = lyricsCard.querySelector('textarea');
                const lyricsButton = lyricsCard.querySelector('.icon-button');
                const searchButton = searchCard.querySelector('.icon-button');
                
                if (lyricsCard.classList.contains('active') && document.activeElement !== lyricsTextarea && !lyricsButton.disabled) {
                    event.preventDefault();
                    processLyrics();
                } else if (searchCard.classList.contains('active') && !searchButton.disabled) {
                    event.preventDefault();
                    searchLyrics();
                }
            } else {
                const nextButton = activeStep.querySelector('.nav-button:not(.prev):not([disabled])');
                if (nextButton) {
                    event.preventDefault();
                    nextButton.click();
                }
            }
        }
    }
});

window.addEventListener('load', function() {
    window.onbeforeunload = function() {
        if (appData.currentStep < 4 && appData.currentStep > 1) {
            return "이 페이지를 벗어나면 입력한 내용이 사라집니다. 계속하시겠습니까?";
        }
    };
});

window.addEventListener('resize', () => {
    const adContainers = document.querySelectorAll('.kakao_ad_area');
    adContainers.forEach(ad => {
        if(ad.style.display === 'block') {
            ad.style.display = 'none';
            setTimeout(() => ad.style.display = 'block', 100);
        }
    });
}); 

function scrollToHelp() {
    const targetElement = document.getElementById('help-iframe');
    
    targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

document.getElementById('songTitle2')?.addEventListener('input', updateSearchButton);
document.getElementById('artistName2')?.addEventListener('input', updateSearchButton);
document.querySelector('#lyricsOption textarea').addEventListener('input', updateButtonState);
document.getElementById('emptyLineSwitch').addEventListener('change', updateButtonState);
document.getElementById('songTitle').addEventListener('input', updateSearchButton);
document.getElementById('lyricsPreview').addEventListener('input', updateStep2Button);
document.getElementById('bgImage').addEventListener('change', updateImageDeleteButton);

updateProgress();
updateButtonState();
updateSearchButton();
loadOptionsFromStorage();
updateImageDeleteButton();
updateIframe(1);
