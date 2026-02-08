
import { t } from './language-ui.js';

export function generateCertificate(donorData) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 850;
        const ctx = canvas.getContext('2d');

        const signImg = new Image();
        signImg.src = 'image/sign.png';
        
        signImg.onload = function() {
            drawCertificate(canvas, ctx, donorData, signImg);
            resolve(canvas);
        };
        
        signImg.onerror = function() {
            drawCertificate(canvas, ctx, donorData, null);
            resolve(canvas);
        };
    });
}

function drawCertificate(canvas, ctx, donorData, signImg) {

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#fef2f2');
    gradient.addColorStop(0.5, '#ffffff');
    gradient.addColorStop(1, '#fef2f2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

    drawElegantCorner(ctx, 70, 70, 60);
    drawElegantCorner(ctx, canvas.width - 70, 70, 60, true);
    drawElegantCorner(ctx, 70, canvas.height - 70, 60, false, true);
    drawElegantCorner(ctx, canvas.width - 70, canvas.height - 70, 60, true, true);

    ctx.shadowColor = 'rgba(220, 38, 38, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 50px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE', canvas.width / 2, 110);
    
    ctx.font = 'bold 32px Georgia, serif';
    ctx.fillStyle = '#dc2626';
    ctx.fillText('OF APPRECIATION', canvas.width / 2, 150);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = '#374151';
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText('Blood Donation Community', canvas.width / 2, 185);

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(350, 205, 500, 2);
    ctx.beginPath();
    ctx.arc(350, 206, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(850, 206, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6b7280';
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText('This is proudly presented to', canvas.width / 2, 250);

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 48px Brush Script MT, cursive';
    const donorName = donorData.fullName || 'Donor Name';
    ctx.fillText(donorName, canvas.width / 2, 315);

    const nameWidth = ctx.measureText(donorName).width;
    const gradient2 = ctx.createLinearGradient((canvas.width - nameWidth) / 2, 325, (canvas.width + nameWidth) / 2, 325);
    gradient2.addColorStop(0, 'rgba(220, 38, 38, 0)');
    gradient2.addColorStop(0.5, '#dc2626');
    gradient2.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.strokeStyle = gradient2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo((canvas.width - nameWidth) / 2 - 30, 330);
    ctx.lineTo((canvas.width + nameWidth) / 2 + 30, 330);
    ctx.stroke();

    ctx.fillStyle = '#374151';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('for the noble act of donating blood on', canvas.width / 2, 380);

    const donationDate = donorData.lastDonateDate 
        ? new Date(donorData.lastDonateDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    
    ctx.fillStyle = '#fef2f2';
    ctx.fillRect(canvas.width / 2 - 180, 400, 360, 50);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 180, 400, 360, 50);
    
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText(donationDate, canvas.width / 2, 433);

    const bloodGroup = donorData.bloodGroup || 'O+';
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 80, 470, 160, 80, 10);
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 75, 475, 150, 70, 8);
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Arial';
    ctx.fillText(bloodGroup, canvas.width / 2, 523);

    ctx.fillStyle = '#1f2937';
    ctx.font = '21px Georgia, serif';
    ctx.fillText('Your selfless act has the potential to save up to three lives.', canvas.width / 2, 590);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillText('Thank you for being a hero in our community!', canvas.width / 2, 620);

    const certificateId = generateCertificateId(donorData);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(400, 670, 400, 30);
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Courier New, monospace';
    ctx.fillText(`Certificate ID: ${certificateId}`, canvas.width / 2, 690);

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(180, 735);
    ctx.lineTo(420, 735);
    ctx.stroke();
    
    if (signImg) {
        const signWidth = 120;
        const signHeight = 60;
        const signX = 300 - signWidth / 2;
        const signY = 665; // Moved up more so it doesn't touch the line
        ctx.drawImage(signImg, signX, signY, signWidth, signHeight);
    } else {
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(200, 705);
        ctx.quadraticCurveTo(220, 695, 250, 700);
        ctx.quadraticCurveTo(270, 705, 280, 690);
        ctx.quadraticCurveTo(290, 680, 310, 695);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(250, 700);
        ctx.quadraticCurveTo(260, 710, 270, 705);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(320, 700);
        ctx.quadraticCurveTo(340, 690, 360, 700);
        ctx.quadraticCurveTo(380, 710, 400, 695);
        ctx.stroke();
    }
    
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(780, 735);
    ctx.lineTo(1020, 735);
    ctx.stroke();
    
    ctx.fillStyle = '#6b7280';
    ctx.font = 'italic 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Authorized Signature', 300, 760);
    
    const issueDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    ctx.fillStyle = '#1f2937';
    ctx.font = '18px Georgia, serif';
    ctx.fillText(issueDate, 900, 725); // Positioned above the line

    ctx.fillStyle = '#dc2626';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(canvas.width / 2 - 20 + (i * 20), 705, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawElegantCorner(ctx, x, y, size, flipX = false, flipY = false) {
    ctx.save();
    ctx.translate(x, y);
    if (flipX) ctx.scale(-1, 1);
    if (flipY) ctx.scale(1, -1);
    
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, 0);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, size);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI / 2);
    ctx.stroke();
    
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(size * 0.7, size * 0.7, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(size, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, size, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function generateCertificateId(donorData) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bloodGroup = (donorData.bloodGroup || 'XX').replace(/[+-]/g, '');
    return `BDC-${bloodGroup}-${timestamp}-${random}`;
}

export function downloadCertificate(canvas, donorName) {
    import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
        .then((module) => {
            const { jsPDF } = window.jspdf;
            
            const scale = 2; // 2x scaling for higher quality
            const highResCanvas = document.createElement('canvas');
            highResCanvas.width = canvas.width * scale;
            highResCanvas.height = canvas.height * scale;
            const highResCtx = highResCanvas.getContext('2d');
            
            highResCtx.imageSmoothingEnabled = true;
            highResCtx.imageSmoothingQuality = 'high';
            
            highResCtx.scale(scale, scale);
            highResCtx.drawImage(canvas, 0, 0);
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.height, canvas.width],
                compress: false, // Disable compression for higher quality
                precision: 16 // Maximum precision
            });
            
            const imgData = highResCanvas.toDataURL('image/jpeg', 1.0); // JPEG at maximum quality
            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
            
            const fileName = `Blood_Donation_Certificate_${donorName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            pdf.save(fileName);
        })
        .catch((error) => {
            console.error('Error loading jsPDF:', error);
            const link = document.createElement('a');
            const fileName = `Blood_Donation_Certificate_${donorName.replace(/\s+/g, '_')}_${Date.now()}.png`;
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
}

export function shareCertificate(canvas, donorName) {
    canvas.toBlob((blob) => {
        const file = new File([blob], 'certificate.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
            navigator.share({
                title: 'Blood Donation Certificate',
                text: `I donated blood and received this certificate from Blood Donation Community! 🩸 #BloodDonation #SaveLives`,
                files: [file]
            }).catch((error) => {
                console.error('Error sharing:', error);
                fallbackShare(canvas);
            });
        } else {
            fallbackShare(canvas);
        }
    });
}

function fallbackShare(canvas) {
    const shareOptions = `
        <div class="flex flex-col gap-3">
            <p class="text-gray-700">Share your certificate:</p>
            <button onclick="downloadFromModal()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                <i class="fa-solid fa-download mr-2"></i>Download Certificate
            </button>
            <div class="text-center text-gray-500 text-sm mt-2">
                Download and share on your social media platforms!
            </div>
        </div>
    `;
    
    showModal('Share Certificate', shareOptions);
}

export function showCertificateModal(donorData) {
    generateCertificate(donorData).then(canvas => {
        const imageUrl = canvas.toDataURL('image/png');
        
        const modalContent = `
            <div class="flex flex-col gap-4">
                <div class="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                    <img src="${imageUrl}" alt="Donation Certificate" class="w-full h-auto rounded shadow-lg">
                </div>
                <div class="flex gap-3 justify-center">
                    <button onclick="downloadCertificateFromModal('${donorData.fullName}')" 
                        class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2">
                        <i class="fa-solid fa-download"></i>
                        <span data-i18n="certDownload">Download</span>
                    </button>
                    <button onclick="shareCertificateFromModal('${donorData.fullName}')" 
                        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                        <i class="fa-solid fa-share-nodes"></i>
                        <span data-i18n="certShare">Share</span>
                    </button>
                </div>
            </div>
        `;
        
        showModal(t('certTitle') || 'Your Donation Certificate', modalContent);
        
        window.currentCertificateCanvas = canvas;
        window.currentDonorName = donorData.fullName;
    }).catch(error => {
        console.error('Error generating certificate:', error);
        showModal('Error', '<p class="text-red-600">Failed to generate certificate. Please try again.</p>');
    });
}

window.downloadCertificateFromModal = function(donorName) {
    if (window.currentCertificateCanvas) {
        downloadCertificate(window.currentCertificateCanvas, donorName || window.currentDonorName);
    }
};

window.shareCertificateFromModal = function(donorName) {
    if (window.currentCertificateCanvas) {
        shareCertificate(window.currentCertificateCanvas, donorName || window.currentDonorName);
    }
};

function showModal(title, content) {
    const modal = document.getElementById('certificate-modal') || createCertificateModal();
    const modalTitle = modal.querySelector('#certificate-modal-title');
    const modalContent = modal.querySelector('#certificate-modal-content');
    
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function createCertificateModal() {
    const modal = document.createElement('div');
    modal.id = 'certificate-modal';
    modal.className = 'fixed inset-0 hidden items-center justify-center z-[60]';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black opacity-50" onclick="closeCertificateModal()"></div>
        <div class="bg-white rounded-lg shadow-xl p-6 max-w-3xl mx-4 z-10 relative max-h-[90vh] overflow-y-auto">
            <button onclick="closeCertificateModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
                <i class="fa-solid fa-times text-xl"></i>
            </button>
            <h3 id="certificate-modal-title" class="text-2xl font-bold text-red-700 mb-4"></h3>
            <div id="certificate-modal-content"></div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

window.closeCertificateModal = function() {
    const modal = document.getElementById('certificate-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

export function initCertificateFeature() {
    createCertificateModal();
    console.log('Certificate feature initialized');
}
