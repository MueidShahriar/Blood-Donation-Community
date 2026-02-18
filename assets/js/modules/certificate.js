
import { t } from './language-ui.js';

export function generateCertificate(donorData) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 850;
        const ctx = canvas.getContext('2d');

        // Ensure Dancing Script font is loaded for stylish donor name
        const fontPromise = document.fonts.load('bold 48px "Dancing Script"').catch(() => {});

        const signImg = new Image();
        signImg.src = 'image/sign.png';
        
        signImg.onload = function() {
            fontPromise.then(() => {
                drawCertificate(canvas, ctx, donorData, signImg);
                resolve(canvas);
            });
        };
        
        signImg.onerror = function() {
            fontPromise.then(() => {
                drawCertificate(canvas, ctx, donorData, null);
                resolve(canvas);
            });
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
    ctx.font = 'bold 52px "Dancing Script", "Brush Script MT", cursive';
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
        const signY = 665;
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
    ctx.fillText(issueDate, 900, 725);

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
            
            const scale = 2;
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
                compress: false,
                precision: 16
            });
            
            const imgData = highResCanvas.toDataURL('image/jpeg', 1.0);
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

export function showDonorCardModal(donorData, containerEl) {
    const esc = (value) => {
        const text = value == null || value === '' ? '—' : String(value);
        return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    };

    const name = esc(donorData.fullName || 'Donor');
    const blood = esc(donorData.bloodGroup || '—');
    const location = esc(donorData.location || '—');
    const phone = esc(donorData.phone || '—');
    const email = esc(donorData.email || '—');
    const gender = esc(donorData.gender || '—');
    const initials = (donorData.fullName || 'D').split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0,2).toUpperCase();
    const lastDonate = donorData.lastDonateDate
        ? new Date(donorData.lastDonateDate + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
        : 'Not recorded';

    // Total donations count
    const totalDonations = donorData.totalDonations || 0;

    // Next eligible date (last donation + 90 days)
    let nextEligible = '—';
    if (donorData.lastDonateDate) {
        const last = new Date(donorData.lastDonateDate + 'T00:00:00');
        const nextDate = new Date(last.getTime() + 90 * 24 * 60 * 60 * 1000);
        const now = new Date();
        if (nextDate <= now) {
            nextEligible = '<span style="color:#059669;font-weight:800">✓ Eligible Now</span>';
        } else {
            nextEligible = esc(nextDate.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }));
        }
    }

    // Age from DOB
    let ageDisplay = '—';
    if (donorData.dateOfBirth) {
        const dob = new Date(donorData.dateOfBirth + 'T00:00:00');
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
        ageDisplay = `${age} years`;
    }

    // Badge/Rank based on donation count
    let badgeLabel = 'New Donor';
    let badgeColor = '#6b7280';
    let badgeIcon = 'fa-seedling';
    if (totalDonations >= 20) { badgeLabel = 'Platinum'; badgeColor = '#7c3aed'; badgeIcon = 'fa-gem'; }
    else if (totalDonations >= 10) { badgeLabel = 'Gold'; badgeColor = '#d97706'; badgeIcon = 'fa-crown'; }
    else if (totalDonations >= 5) { badgeLabel = 'Silver'; badgeColor = '#475569'; badgeIcon = 'fa-medal'; }
    else if (totalDonations >= 2) { badgeLabel = 'Bronze'; badgeColor = '#b45309'; badgeIcon = 'fa-award'; }

    const cardHtml = `
        <div class="flex flex-col items-center gap-3 sm:gap-4" id="donor-card-wrapper">
            <div id="donor-card-preview" class="w-full" style="max-width:min(28rem,100%)">
                <div style="position:relative;border-radius:1.25rem;overflow:hidden;background:linear-gradient(135deg,#b91c1c 0%,#dc2626 25%,#ef4444 50%,#f97316 75%,#fbbf24 100%);padding:2.5px;box-shadow:0 16px 50px rgba(185,28,28,0.25),0 0 0 1px rgba(255,255,255,0.1)">
                    <div style="border-radius:1.1rem;background:linear-gradient(170deg,#ffffff 0%,#fffbfb 35%,#fff1f2 60%,#fce7f3 85%,#fdf2f8 100%);padding:0;position:relative;overflow:hidden">
                        <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(239,68,68,0.08) 0%,transparent 70%)"></div>
                        <div style="position:absolute;bottom:40px;left:-20px;width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,rgba(249,115,22,0.06) 0%,transparent 70%)"></div>
                        <!-- Header -->
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.1rem 0.6rem;border-bottom:2px solid transparent;border-image:linear-gradient(90deg,rgba(220,38,38,0.2),rgba(249,115,22,0.2),rgba(220,38,38,0.05)) 1">
                            <div style="display:flex;align-items:center;gap:0.5rem">
                                <img src="image/blood-drop.png" alt="" style="width:28px;height:28px;filter:drop-shadow(0 2px 4px rgba(220,38,38,0.3))" />
                                <div>
                                    <div style="font-size:0.62rem;letter-spacing:0.18em;text-transform:uppercase;color:#ef4444;font-weight:700">Blood Donation Community</div>
                                    <div style="font-size:1rem;font-weight:900;background:linear-gradient(135deg,#991b1b,#dc2626);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-top:0px">DONOR CARD</div>
                                </div>
                            </div>
                            <div style="background:linear-gradient(135deg,#b91c1c,#dc2626,#ef4444);color:#fff;font-size:1.35rem;font-weight:900;padding:0.45rem 0.85rem;border-radius:0.75rem;box-shadow:0 6px 20px rgba(185,28,28,0.35),inset 0 1px 0 rgba(255,255,255,0.2);letter-spacing:0.03em;line-height:1;text-shadow:0 1px 2px rgba(0,0,0,0.2)">${blood}</div>
                        </div>
                        <!-- Body -->
                        <div style="display:flex;gap:0.85rem;padding:0.75rem 1.1rem;align-items:center">
                            <div id="donor-card-photo-area" style="width:68px;height:68px;border-radius:0.9rem;background:linear-gradient(135deg,#b91c1c,#dc2626,#f97316);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:900;flex-shrink:0;overflow:hidden;border:3px solid #fff;box-shadow:0 6px 20px rgba(185,28,28,0.2),0 0 0 2px rgba(220,38,38,0.1);cursor:pointer;position:relative" title="Click to upload photo">
                                <span id="donor-card-initials">${initials}</span>
                                <img id="donor-card-photo-img" src="" alt="" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;inset:0" />
                            </div>
                            <div style="min-width:0;flex:1">
                                <div style="font-size:1.25rem;font-weight:800;color:#1f2937;line-height:1.2">${name}</div>
                                <div style="font-size:0.78rem;color:#6b7280;margin-top:1px">${email}</div>
                                <div style="display:flex;align-items:center;gap:0.4rem;margin-top:3px">
                                    <span style="display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:9999px;font-size:0.65rem;font-weight:700;color:${badgeColor};background:${badgeColor}18;border:1px solid ${badgeColor}30">
                                        <i class="fa-solid ${badgeIcon}" style="font-size:0.58rem"></i>${badgeLabel}
                                    </span>
                                    <span style="font-size:0.65rem;color:#9ca3af;font-weight:600">${gender !== '—' ? gender : ''}</span>
                                </div>
                            </div>
                        </div>
                        <!-- Stats row -->
                        <div style="display:flex;justify-content:space-around;padding:0.45rem 1rem;background:linear-gradient(90deg,rgba(254,242,242,0.6),rgba(252,231,243,0.4));border-top:1px solid rgba(225,29,72,0.06);border-bottom:1px solid rgba(225,29,72,0.06)">
                            <div style="text-align:center;flex:1">
                                <div style="font-size:1.35rem;font-weight:900;color:#dc2626;line-height:1.2">${totalDonations}</div>
                                <div style="font-size:0.65rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Donations</div>
                            </div>
                            <div style="width:1px;background:rgba(225,29,72,0.12)"></div>
                            <div style="text-align:center;flex:1">
                                <div style="font-size:1rem;font-weight:800;color:#1f2937;line-height:1.2">${ageDisplay}</div>
                                <div style="font-size:0.65rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Age</div>
                            </div>
                        </div>
                        <!-- Info grid -->
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
                            <div style="padding:0.5rem 1rem;border-right:1px solid rgba(225,29,72,0.06);border-bottom:1px solid rgba(225,29,72,0.06)">
                                <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#ef4444"><i class="fa-solid fa-location-dot" style="color:#dc2626;margin-right:2px;font-size:0.6rem"></i>Location</div>
                                <div style="font-size:0.92rem;font-weight:700;color:#1f2937;margin-top:1px">${location}</div>
                            </div>
                            <div style="padding:0.5rem 1rem;border-bottom:1px solid rgba(225,29,72,0.06)">
                                <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#ef4444"><i class="fa-solid fa-phone" style="color:#dc2626;margin-right:2px;font-size:0.6rem"></i>Phone</div>
                                <div style="font-size:0.92rem;font-weight:700;color:#1f2937;margin-top:1px">${phone}</div>
                            </div>
                            <div style="padding:0.5rem 1rem;border-right:1px solid rgba(225,29,72,0.06);border-bottom:1px solid rgba(225,29,72,0.06)">
                                <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#ef4444">🗓️ Last Donation</div>
                                <div style="font-size:0.92rem;font-weight:700;color:#1f2937;margin-top:1px">${lastDonate}</div>
                            </div>
                            <div style="padding:0.5rem 1rem;border-bottom:1px solid rgba(225,29,72,0.06)">
                                <div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#ef4444"><i class="fa-solid fa-calendar-check" style="color:#dc2626;margin-right:2px;font-size:0.6rem"></i>Next Eligible</div>
                                <div style="font-size:0.92rem;font-weight:700;color:#1f2937;margin-top:1px">${nextEligible}</div>
                            </div>
                        </div>
                        <!-- Footer -->
                        <div style="display:flex;align-items:center;justify-content:center;padding:0.45rem 1rem;background:linear-gradient(135deg,rgba(185,28,28,0.06),rgba(249,115,22,0.04));border-radius:0 0 1.1rem 1.1rem">
                            <span style="font-size:0.68rem;font-weight:700;background:linear-gradient(135deg,#b91c1c,#dc2626);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:0.08em"><i class="fa-solid fa-heart" style="margin-right:4px;-webkit-text-fill-color:#dc2626"></i>Donate Blood, Save Lives</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Upload + download area -->
            <div class="flex flex-col items-center gap-2 w-full" style="max-width:min(28rem,100%)">
                <label id="donor-card-upload-label" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;border-radius:0.7rem;border:1.5px dashed rgba(220,38,38,0.3);background:rgba(254,242,242,0.6);color:#dc2626;font-size:0.82rem;font-weight:600;cursor:pointer;transition:all 0.2s" onmouseover="this.style.borderColor='#dc2626';this.style.background='#fef2f2'" onmouseout="this.style.borderColor='rgba(220,38,38,0.3)';this.style.background='rgba(254,242,242,0.6)'">
                    <i class="fa-solid fa-camera"></i>
                    <span id="donor-card-upload-text">Upload Photo</span>
                    <input type="file" id="donor-card-photo-input" accept="image/*" style="display:none" />
                </label>
                <button id="donor-card-download-btn" onclick="window.__downloadDonorCard()" disabled style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.5rem 1.3rem;border-radius:0.7rem;background:#d1d5db;color:#fff;font-size:0.85rem;font-weight:700;border:none;cursor:not-allowed;box-shadow:none;transition:all 0.2s;opacity:0.7">
                    <i class="fa-solid fa-download"></i>
                    Download Donor Card
                </button>
                <p id="donor-card-photo-hint" style="font-size:0.72rem;color:#dc2626;text-align:center;font-weight:600;margin:0"><i class="fa-solid fa-circle-info" style="margin-right:3px"></i>Please upload your photo first to download the card.</p>
            </div>
        </div>
    `;



    // Render: inline into container or in modal
    if (containerEl) {
        containerEl.innerHTML = cardHtml;
    } else {
        showModal('Your Donor Card', cardHtml);
    }

    // Wire up photo upload
    setTimeout(() => {
        const fileInput = document.getElementById('donor-card-photo-input');
        const photoArea = document.getElementById('donor-card-photo-area');
        const photoImg = document.getElementById('donor-card-photo-img');
        const initialsEl = document.getElementById('donor-card-initials');
        const uploadText = document.getElementById('donor-card-upload-text');

        photoArea?.addEventListener('click', () => fileInput?.click());

        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (photoImg) {
                    photoImg.src = ev.target.result;
                    photoImg.style.display = 'block';
                }
                if (initialsEl) initialsEl.style.display = 'none';
                if (uploadText) uploadText.textContent = 'Change Photo';
                // Enable download button
                const dlBtn = document.getElementById('donor-card-download-btn');
                if (dlBtn) {
                    dlBtn.disabled = false;
                    dlBtn.style.background = 'linear-gradient(135deg,#0f766e,#14b8a6)';
                    dlBtn.style.cursor = 'pointer';
                    dlBtn.style.opacity = '1';
                    dlBtn.style.boxShadow = '0 4px 14px rgba(20,184,166,0.2)';
                    dlBtn.onmouseover = function(){ this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 20px rgba(20,184,166,0.3)'; };
                    dlBtn.onmouseout = function(){ this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 14px rgba(20,184,166,0.2)'; };
                }
                const hint = document.getElementById('donor-card-photo-hint');
                if (hint) { hint.style.color = '#10b981'; hint.innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right:3px"></i>Photo uploaded! You can now download your card.'; }
            };
            reader.readAsDataURL(file);
        });

        // Download handler
        window.__downloadDonorCard = function() {
            const preview = document.getElementById('donor-card-preview');
            if (!preview) return;
            if (!photoImg?.src || photoImg.style.display === 'none') {
                const hint = document.getElementById('donor-card-photo-hint');
                if (hint) { hint.style.color = '#dc2626'; hint.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="margin-right:3px"></i>Photo is required! Please upload your photo first.'; }
                return;
            }
            _renderDonorCardCanvas(donorData, photoImg.src)
                .then(canvas => {
                    const link = document.createElement('a');
                    link.download = `Donor_Card_${(donorData.fullName || 'card').replace(/\s+/g, '_')}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                });
        };
    }, 100);
}

function _renderDonorCardCanvas(donorData, photoSrc) {
    return new Promise((resolve) => {
        const SCALE = 3;
        const W = 750, H = 390;
        const canvas = document.createElement('canvas');
        canvas.width = W * SCALE; canvas.height = H * SCALE;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(SCALE, SCALE);

        // Background
        const bg = ctx.createLinearGradient(0,0,W,H);
        bg.addColorStop(0,'#ffffff'); bg.addColorStop(0.35,'#fffbfb'); bg.addColorStop(0.6,'#fff1f2'); bg.addColorStop(0.85,'#fce7f3'); bg.addColorStop(1,'#fdf2f8');
        ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

        // Decorative circles
        ctx.fillStyle = 'rgba(239,68,68,0.04)';
        ctx.beginPath(); ctx.arc(W-60, 60, 100, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(249,115,22,0.03)';
        ctx.beginPath(); ctx.arc(40, H-60, 70, 0, Math.PI*2); ctx.fill();

        // Top gradient bar
        const topBar = ctx.createLinearGradient(0,0,W,0);
        topBar.addColorStop(0,'#b91c1c'); topBar.addColorStop(0.3,'#dc2626'); topBar.addColorStop(0.6,'#ef4444'); topBar.addColorStop(0.85,'#f97316'); topBar.addColorStop(1,'#fbbf24');
        ctx.fillStyle = topBar; ctx.fillRect(0,0,W,8);

        // Bottom gradient bar
        const btmBar = ctx.createLinearGradient(0,0,W,0);
        btmBar.addColorStop(0,'#fbbf24'); btmBar.addColorStop(0.5,'#f97316'); btmBar.addColorStop(1,'#dc2626');
        ctx.fillStyle = btmBar; ctx.fillRect(0,H-4,W,4);

        // Corner accents
        ctx.strokeStyle = 'rgba(220,38,38,0.2)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(18,38); ctx.lineTo(18,18); ctx.lineTo(38,18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W-18,38); ctx.lineTo(W-18,18); ctx.lineTo(W-38,18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(18,H-38); ctx.lineTo(18,H-18); ctx.lineTo(38,H-18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W-18,H-38); ctx.lineTo(W-18,H-18); ctx.lineTo(W-38,H-18); ctx.stroke();

        // Header
        ctx.fillStyle = '#ef4444'; ctx.font = '700 11px Arial';
        ctx.fillText('BLOOD DONATION COMMUNITY', 30, 44);
        ctx.fillStyle = '#991b1b'; ctx.font = '900 20px Arial';
        ctx.fillText('DONOR CARD', 30, 66);

        // Blood group badge
        ctx.fillStyle = 'rgba(185,28,28,0.15)';
        ctx.beginPath(); ctx.roundRect(W-108, 30, 76, 44, 10); ctx.fill();
        const badgeGrad = ctx.createLinearGradient(W-105,26,W-105+76,26+44);
        badgeGrad.addColorStop(0,'#b91c1c'); badgeGrad.addColorStop(0.5,'#dc2626'); badgeGrad.addColorStop(1,'#ef4444');
        ctx.fillStyle = badgeGrad;
        ctx.beginPath(); ctx.roundRect(W-110, 26, 76, 44, 10); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = '900 24px Arial'; ctx.textAlign = 'center';
        ctx.fillText(donorData.bloodGroup || '—', W-72, 56);
        ctx.textAlign = 'left';

        // Divider
        const divGrad = ctx.createLinearGradient(30,0,W-30,0);
        divGrad.addColorStop(0,'rgba(220,38,38,0.2)'); divGrad.addColorStop(0.5,'rgba(249,115,22,0.15)'); divGrad.addColorStop(1,'rgba(220,38,38,0.05)');
        ctx.fillStyle = divGrad; ctx.fillRect(30, 78, W-60, 2);

        // Photo area
        const photoX = 36, photoY = 90, photoS = 68;
        ctx.save();
        ctx.beginPath(); ctx.roundRect(photoX, photoY, photoS, photoS, 14); ctx.clip();
        const circGrad = ctx.createLinearGradient(photoX, photoY, photoX+photoS, photoY+photoS);
        circGrad.addColorStop(0,'#b91c1c'); circGrad.addColorStop(0.5,'#dc2626'); circGrad.addColorStop(1,'#f97316');
        ctx.fillStyle = circGrad; ctx.fillRect(photoX, photoY, photoS, photoS);
        ctx.restore();
        ctx.strokeStyle = 'rgba(220,38,38,0.12)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(photoX-1, photoY-1, photoS+2, photoS+2, 15); ctx.stroke();

        // Computed values
        const totalDonations = donorData.totalDonations || 0;
        let nextEligible = '—';
        if (donorData.lastDonateDate) {
            const last = new Date(donorData.lastDonateDate + 'T00:00:00');
            const nextDate = new Date(last.getTime() + 90 * 24 * 60 * 60 * 1000);
            nextEligible = nextDate <= new Date() ? 'Eligible Now' : nextDate.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
        }
        let ageDisplay = '—';
        if (donorData.dateOfBirth) {
            const dob = new Date(donorData.dateOfBirth + 'T00:00:00');
            const now = new Date();
            let age = now.getFullYear() - dob.getFullYear();
            if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
            ageDisplay = age + ' yrs';
        }
        let badgeLabel = 'New Donor';
        if (totalDonations >= 20) badgeLabel = 'Platinum';
        else if (totalDonations >= 10) badgeLabel = 'Gold';
        else if (totalDonations >= 5) badgeLabel = 'Silver';
        else if (totalDonations >= 2) badgeLabel = 'Bronze';

        const drawRest = () => {
            // Name and info
            ctx.fillStyle = '#1f2937'; ctx.font = '800 22px Arial';
            ctx.fillText(donorData.fullName || 'Donor', 118, 114);
            ctx.fillStyle = '#6b7280'; ctx.font = '400 13px Arial';
            ctx.fillText(donorData.email || '—', 118, 132);
            // Badge + Gender
            ctx.fillStyle = '#7c3aed'; ctx.font = '700 10px Arial';
            ctx.fillText('\u{1F3C5} ' + badgeLabel, 118, 150);
            if (donorData.gender && donorData.gender !== '—') {
                ctx.fillStyle = '#9ca3af'; ctx.font = '600 10px Arial';
                ctx.fillText('• ' + donorData.gender, 118 + ctx.measureText('\u{1F3C5} ' + badgeLabel).width + 10, 150);
            }

            // Stats bar
            const statY = 168;
            ctx.fillStyle = 'rgba(254,242,242,0.5)'; ctx.fillRect(30, statY, W-60, 40);
            ctx.fillStyle = 'rgba(225,29,72,0.06)'; ctx.fillRect(30, statY, W-60, 1); ctx.fillRect(30, statY+39, W-60, 1);
            const statW = (W-60)/2;
            // Donations
            ctx.fillStyle = '#dc2626'; ctx.font = '900 20px Arial'; ctx.textAlign = 'center';
            ctx.fillText(String(totalDonations), 30+statW*0.5, statY+20);
            ctx.fillStyle = '#9ca3af'; ctx.font = '700 9px Arial';
            ctx.fillText('DONATIONS', 30+statW*0.5, statY+33);
            // Age
            ctx.fillStyle = '#1f2937'; ctx.font = '800 16px Arial';
            ctx.fillText(ageDisplay, 30+statW*1.5, statY+20);
            ctx.fillStyle = '#9ca3af'; ctx.font = '700 9px Arial';
            ctx.fillText('AGE', 30+statW*1.5, statY+33);
            // Vertical separator
            ctx.fillStyle = 'rgba(225,29,72,0.12)';
            ctx.fillRect(30+statW, statY+6, 1, 28);
            ctx.textAlign = 'left';

            // Info grid
            const gridY = 214;
            const col1X = 44, col2X = W/2+16;
            const halfW = (W-60)/2;

            // Row 1 backgrounds
            ctx.fillStyle = 'rgba(254,242,242,0.4)'; ctx.fillRect(30, gridY, halfW-1, 48);
            ctx.fillStyle = 'rgba(252,231,243,0.3)'; ctx.fillRect(30+halfW+1, gridY, halfW-1, 48);
            // Location
            ctx.fillStyle = '#ef4444'; ctx.font = '700 9px Arial';
            ctx.fillText('\u{1F4CD} LOCATION', col1X, gridY+16);
            ctx.fillStyle = '#1f2937'; ctx.font = '700 15px Arial';
            ctx.fillText(donorData.location || '—', col1X, gridY+36);
            // Phone
            ctx.fillStyle = '#ef4444'; ctx.font = '700 9px Arial';
            ctx.fillText('\u{1F4DE} PHONE', col2X, gridY+16);
            ctx.fillStyle = '#1f2937'; ctx.font = '700 15px Arial';
            ctx.fillText(donorData.phone || '—', col2X, gridY+36);

            // Row 2
            ctx.fillStyle = 'rgba(225,29,72,0.04)'; ctx.fillRect(30, gridY+49, W-60, 48);
            // Last Donation
            ctx.fillStyle = '#ef4444'; ctx.font = '700 9px Arial';
            ctx.fillText('\u{1F5D3}\uFE0F LAST DONATION', col1X, gridY+66);
            const lastD = donorData.lastDonateDate
                ? new Date(donorData.lastDonateDate+'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
                : 'Not recorded';
            ctx.fillStyle = '#1f2937'; ctx.font = '700 15px Arial';
            ctx.fillText(lastD, col1X, gridY+86);
            // Next eligible
            ctx.fillStyle = '#ef4444'; ctx.font = '700 9px Arial';
            ctx.fillText('\u2705 NEXT ELIGIBLE', col2X, gridY+66);
            ctx.fillStyle = nextEligible === 'Eligible Now' ? '#059669' : '#1f2937'; ctx.font = '700 15px Arial';
            ctx.fillText(nextEligible, col2X, gridY+86);

            // Footer
            const footGrad = ctx.createLinearGradient(0,0,W,0);
            footGrad.addColorStop(0,'rgba(185,28,28,0.06)'); footGrad.addColorStop(0.5,'rgba(249,115,22,0.04)'); footGrad.addColorStop(1,'rgba(185,28,28,0.06)');
            ctx.fillStyle = footGrad; ctx.fillRect(0, H-36, W, 32);
            ctx.fillStyle = '#b91c1c'; ctx.font = '700 12px Arial'; ctx.textAlign = 'center';
            ctx.fillText('\u2764  Donate Blood, Save Lives', W/2, H-16);
            ctx.textAlign = 'left';

            // Outer border
            ctx.strokeStyle = 'rgba(220,38,38,0.15)'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.roundRect(1,1,W-2,H-2,18); ctx.stroke();

            resolve(canvas);
        };

        if (photoSrc) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                ctx.save();
                ctx.beginPath(); ctx.roundRect(photoX, photoY, photoS, photoS, 14); ctx.clip();
                ctx.drawImage(img, photoX, photoY, photoS, photoS);
                ctx.restore();
                drawRest();
            };
            img.onerror = () => {
                const init = (donorData.fullName||'D').split(/\s+/).filter(Boolean).map(p=>p[0]).join('').slice(0,2).toUpperCase();
                ctx.fillStyle = '#ffffff'; ctx.font = '900 22px Arial'; ctx.textAlign = 'center';
                ctx.fillText(init, photoX+photoS/2, photoY+photoS/2+8); ctx.textAlign = 'left';
                drawRest();
            };
            img.src = photoSrc;
        } else {
            const init = (donorData.fullName||'D').split(/\s+/).filter(Boolean).map(p=>p[0]).join('').slice(0,2).toUpperCase();
            ctx.fillStyle = '#ffffff'; ctx.font = '900 22px Arial'; ctx.textAlign = 'center';
            ctx.fillText(init, photoX+photoS/2, photoY+photoS/2+8); ctx.textAlign = 'left';
            drawRest();
        }
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
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeCertificateModal()"></div>
        <div class="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 w-[95vw] sm:w-auto sm:max-w-3xl z-10 relative max-h-[92vh] overflow-y-auto overscroll-contain" style="-webkit-overflow-scrolling:touch;scroll-behavior:smooth">
            <button onclick="closeCertificateModal()" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition" aria-label="Close">
                <i class="fa-solid fa-times text-sm"></i>
            </button>
            <h3 id="certificate-modal-title" class="text-xl sm:text-2xl font-bold text-red-700 mb-4 pr-8"></h3>
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
