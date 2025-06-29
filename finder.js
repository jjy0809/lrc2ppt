let currentFileName = '';

const downloadBtn = document.getElementById('downloadBtn');
const previewFrame = document.getElementById('previewFrame');
const searchInput = document.getElementById('searchInput');
const noPPTMessage = document.getElementById('noPPTfind');

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    if (query) {
        searchInput.value = query;
        searchPPT();
    }
});

function normalizeString(str) {
    return str.replace(/\s+/g, '');
}

async function checkFileExists(filename) {
    try {
        const response = await fetch(`https://www.lrc2ppt.kr/ppt/files/${encodeURIComponent(filename)}`);
        return response.status === 200;
    } catch (error) {
        try {
            const response = await fetch(`https://lrc2ppt.kr/ppt/files/${encodeURIComponent(filename)}`);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
}

async function searchPPT() {
    const rawQuery = searchInput.value.trim();
    const query = normalizeString(rawQuery);

    if (!query) {
        alert('❗ 곡 제목을 입력해주세요')
        return;
    }

    const fileName = `${query}.pptx`;
    const fileExists = await checkFileExists(fileName);

    window.history.replaceState(
        { query: rawQuery }, 
        '', 
        `?query=${encodeURIComponent(rawQuery)}` 
    );

    if (fileExists) {
        currentFileName = fileName;
        previewFrame.style.display = 'block';
        previewFrame.src = `https://view.officeapps.live.com/op/embed.aspx?src=https://lrc2ppt.kr/ppt/files/${encodeURIComponent(fileName)}`;
        previewFrame.style.height = '400px';
        downloadBtn.disabled = false;
        errorMessage.textContent = '';
        window.history.replaceState(null, null, `?query=${encodeURIComponent(rawQuery)}`);
    } else {
        previewFrame.style.height = '100px';
        downloadBtn.disabled = true;
        previewFrame.src = 'about:blank';
        alert("❗ 해당 PPT 파일이 존재하지 않습니다. '피피티 메이커'를 통해 직접 무료로 제작해보세요!");
        //noPPTMessage.style.display = 'block';

    }
}

function downloadPPT() {
    if (!currentFileName) return;
    window.location.href = `https://lrc2ppt.kr/ppt/files/${encodeURIComponent(currentFileName)}`;
}

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchPPT();
});
