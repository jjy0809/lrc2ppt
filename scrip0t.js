const appData = {
    currentStep: 1,
    totalSteps: 4,
    lyrics: [],
    options: {
        fileName: '가사 피피티',
        fontSize: 60,
        fontColor: [0,0,0],
        bgColor: [255,255,255],
        bgImage: null,
        lineMode: 'single',
        autoWrap: true,
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

function updateProgress() {
    const progress = ((appData.currentStep - 1) / (appData.totalSteps - 1)) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

function showStep(step) {
    appData.currentStep = step;
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    if (step === 2) {
        const preview = document.getElementById('lyricsPreview');
        preview.value = appData.lyrics.join('\n');
        preview.dispatchEvent(new Event('input'));
    }
    updateProgress();
    if(step === 3) updateImageDeleteButton();
}

function resetForm() {
    location.reload(); // 페이지 새로고침으로 변경
}

async function searchLyrics() {
    const searchBtn = document.querySelector('#linkOption .icon-button');
    const spinner = searchBtn.querySelector('.loading-spinner');
    const title = document.getElementById('songTitle').value;
    const artist = document.getElementById('artistName').value;
    
    searchBtn.disabled = true;
    spinner.style.display = 'block';

    try {
        const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(title)} ${encodeURIComponent(artist)}`, {
            headers: {'Lrclib-Client': 'lrc.kro.kr'}
        });

        if (!response.ok) throw new Error('가사를 찾을 수 없습니다');
        const data = await response.json();
        
        if (!data[0]?.plainLyrics) throw new Error('가사를 찾을 수 없습니다');
        appData.lyrics = data[0].plainLyrics.split('\n');
        showStep(2);
    } catch (error) {
        alert(`❗ ${error.message}`);
    } finally {
        spinner.style.display = 'none';
        updateSearchButton();
    }
}

function updateSearchButton() {
    const title = document.getElementById('songTitle').value;
    const artist = document.getElementById('artistName').value;
    const searchBtn = document.querySelector('#linkOption .icon-button');
    searchBtn.disabled = !(title.trim() && artist.trim());
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

    if(options.bgImage){
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

    const processedLyrics = options.removeEmptyLines ? 
        appData.lyrics.filter(line => line.trim() !== '') : 
        appData.lyrics;

    processLyricsByMode(
        processedLyrics,
        options.lineMode,
        options.autoWrap,
        options.fontSize,
        options.splitPreference
    ).forEach(text => {
        const slide = pres.addSlide({masterName: 'MASTER_SLIDE'});
        
        if (text.trim() !== '' || !options.removeEmptyLines) {
            slide.addText(text, {
                x: 0.5, y: 0.5, w: '95%', h: '90%',
                align: options.horizontalAlign,
                valign: options.verticalAlign,
                fontSize: options.fontSize,
                bold: options.bold,
                italic: options.italic,
                color: rgbToHex(options.fontColor),
                fontFace: 'Malgun Gothic',
                autoFit: { shrinkText: true }
            });
        }

        if(options.title.enable && options.title.text) {
            let xPos;
            const slideWidth = 13.33;
            
            switch(options.title.hPosition) {
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
                fontFace: 'Malgun Gothic'
            });
        }
    });

    return await pres.write({ outputType: 'base64' });
}

const rgbToHex = rgb => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
const hexToRgb = hex => hex.replace('#','').match(/.{2}/g).map(v => parseInt(v, 16));

function processLyricsByMode(lyrics, mode, autoWrap, fontSize, splitPref) {
    const processLine = text => autoWrap ? lineSplit(text, fontSize, splitPref) : text;
    return mode === 'double' ? chunkLines(lyrics.map(processLine), 2) : lyrics.map(processLine);
}

function lineSplit(line, fontSize, splitPref) {
    const textWidth = fontSize * 0.5;
    const maxWidth = Math.floor((13.33 * 72 * 0.45) / textWidth);
    if (line.length <= maxWidth) return line;

    const mid = Math.floor(line.length / 2);
    let splitPoint = splitPref === 'front' 
        ? line.lastIndexOf(' ', maxWidth) 
        : line.indexOf(' ', mid);
    if (splitPoint === -1) splitPoint = mid;

    const firstPart = line.substring(0, splitPoint);
    const secondPart = line.substring(splitPoint + 1).trim();
    return firstPart + '\n' + (secondPart.length > maxWidth ? lineSplit(secondPart, fontSize, splitPref) : secondPart);
}

function chunkLines(arr, size) {
    return arr.reduce((acc, _, i) => (i % size === 0) ? [...acc, arr.slice(i, i+size)] : acc, [])
              .map(group => group.join('\n'));
}

function enableGenerateBtn() {
    document.getElementById('finalGenerateBtn').disabled = false;
}

async function generateFinalPPT() {
    const generateBtn = document.getElementById('finalGenerateBtn');
    const loadingSpinner = generateBtn.querySelector('.loading-spinner');
    
    generateBtn.disabled = true;
    loadingSpinner.style.display = 'block';
    
    try {
        appData.options = {
            ...appData.options,
            fileName: document.getElementById('fileName').value || '가사 피피티',
            fontSize: parseInt(document.getElementById('fontSize').value) || 60,
            fontColor: hexToRgb(document.getElementById('fontColor').value) || [0,0,0],
            bgColor: hexToRgb(document.getElementById('bgColor').value) || [255,255,255],
            bgImage: document.getElementById('bgImage').files[0] || null,
            lineMode: document.getElementById('lineMode').value || 'single',
            autoWrap: document.getElementById('autoWrap').checked ?? true,
            bold: document.getElementById('boldOption').checked ?? true,
            italic: document.getElementById('italicOption').checked ?? false,
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

        saveOptionsToCookie();

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

function saveOptionsToCookie() {
    const optionsToSave = { ...appData.options };
    delete optionsToSave.fileName;
    delete optionsToSave.title.text;
    if(optionsToSave.bgImage) {
        const reader = new FileReader();
        reader.onload = function() {
            optionsToSave.bgImage = reader.result;
            document.cookie = `pptOptions=${JSON.stringify(optionsToSave)}; max-age=${60*60*24*30}; path=/`;
        };
        reader.readAsDataURL(optionsToSave.bgImage);
    } else {
        document.cookie = `pptOptions=${JSON.stringify(optionsToSave)}; max-age=${60*60*24*30}; path=/`;
    }
}

function loadOptionsFromCookie() {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('pptOptions='));
    if (!cookie) return;

    const options = JSON.parse(cookie.split('=')[1]);
    document.getElementById('bgColor').value = `#${rgbToHex(options.bgColor)}`;
    document.getElementById('fontColor').value = `#${rgbToHex(options.fontColor)}`;
    document.getElementById('lineMode').value = options.lineMode;
    document.getElementById('autoWrap').checked = options.autoWrap;
    document.getElementById('boldOption').checked = options.bold;
    document.getElementById('italicOption').checked = options.italic;
    document.getElementById('includeEmptySlides').checked = !options.removeEmptyLines;
    document.getElementById('titleEnable').checked = options.title.enable;
    document.getElementById('titleHPosition').value = options.title.hPosition;
    document.getElementById('titleVPosition').value = options.title.vPosition;
    document.getElementById('titleFontSize').value = options.title.fontSize;
    document.getElementById('titleColor').value = `#${rgbToHex(options.title.color)}`;
    
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
    const options = JSON.parse(document.cookie.split('pptOptions=')[1].split(';')[0]);
    delete options.bgImage;
    document.cookie = `pptOptions=${JSON.stringify(options)}; max-age=${60*60*24*30}; path=/`;
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

// 이벤트 리스너 설정
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

document.querySelectorAll('input, select, textarea').forEach(element => {
    element.addEventListener('change', saveOptionsToCookie);
});

document.querySelector('#lyricsOption textarea').addEventListener('input', updateButtonState);
document.getElementById('emptyLineSwitch').addEventListener('change', updateButtonState);
document.getElementById('songTitle').addEventListener('input', updateSearchButton);
document.getElementById('artistName').addEventListener('input', updateSearchButton);
document.getElementById('lyricsPreview').addEventListener('input', updateStep2Button);
document.getElementById('bgImage').addEventListener('change', updateImageDeleteButton);

// 초기화
updateProgress();
updateButtonState();
updateSearchButton();
loadOptionsFromCookie();
updateImageDeleteButton();
