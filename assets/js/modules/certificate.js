
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

    const _padCert = n => String(n).padStart(2, '0');
    const _fmtDMY = dt => `${_padCert(dt.getDate())}/${_padCert(dt.getMonth()+1)}/${dt.getFullYear()}`;
    const donationDate = donorData.lastDonateDate 
        ? _fmtDMY(new Date(donorData.lastDonateDate))
        : _fmtDMY(new Date());
    
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
    
    const _issueDt = new Date();
    const _pI = n => String(n).padStart(2,'0');
    const issueDate = `${_pI(_issueDt.getDate())}/${_pI(_issueDt.getMonth()+1)}/${_issueDt.getFullYear()}`;
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
        ? (() => { const _d = new Date(donorData.lastDonateDate + 'T00:00:00'); const _p = n => String(n).padStart(2,'0'); return `${_p(_d.getDate())}/${_p(_d.getMonth()+1)}/${_d.getFullYear()}`; })()
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
            nextEligible = esc((() => { const _p = n => String(n).padStart(2,'0'); return `${_p(nextDate.getDate())}/${_p(nextDate.getMonth()+1)}/${nextDate.getFullYear()}`; })());
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

    // Member Since (with Firebase Auth metadata fallback)
    let memberSince = '—';
    const memberSinceSource = donorData.createdAt || donorData.memberSince;
    if (memberSinceSource) {
        const _d = new Date(memberSinceSource);
        if (!isNaN(_d.getTime())) {
            const _p = n => String(n).padStart(2,'0');
            memberSince = `${_p(_d.getDate())}/${_p(_d.getMonth()+1)}/${_d.getFullYear()}`;
        }
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
            <div id="donor-card-preview" class="w-full" style="max-width:min(22rem,100%)">
                <div style="position:relative;border-radius:1.8rem;overflow:hidden;background:linear-gradient(135deg,#b91c1c 0%,#dc2626 20%,#ef4444 45%,#f97316 70%,#fbbf24 100%);padding:3px;box-shadow:0 25px 70px rgba(185,28,28,0.18),0 8px 24px rgba(185,28,28,0.08)">
                    <div style="border-radius:1.6rem;background:linear-gradient(180deg,#fff 0%,#fffbfb 60%,#fef8f8 100%);padding:0;position:relative;overflow:hidden">
                        <!-- Top colored band with org name -->
                        <div style="background:linear-gradient(135deg,#b91c1c 0%,#dc2626 35%,#ef4444 65%,#f97316 100%);padding:0.8rem 1rem 5.5rem;text-align:center;position:relative;overflow:hidden">
                            <div style="position:absolute;top:-40px;right:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.06)"></div>
                            <div style="position:absolute;bottom:-20px;left:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.04)"></div>
                            <div style="display:flex;align-items:center;justify-content:center">
                                <span style="font-size:0.58rem;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.85);font-weight:700">Blood Donation Community</span>
                            </div>
                            <div style="font-size:1.1rem;font-weight:900;color:#fff;letter-spacing:0.12em;margin-top:4px;text-shadow:0 2px 8px rgba(0,0,0,0.1)">DONOR CARD</div>
                        </div>
                        <!-- Photo overlapping header/body boundary -->
                        <div style="display:flex;flex-direction:column;align-items:center;margin-top:-3rem;position:relative;z-index:2">
                            <div style="padding:4px;border-radius:50%;background:transparent;box-shadow:0 0 0 3px rgba(220,38,38,0.08)">
                                <div id="donor-card-photo-area" style="width:160px;height:160px;border-radius:50%;background:linear-gradient(135deg,#b91c1c,#dc2626,#f97316);color:#fff;display:flex;align-items:center;justify-content:center;font-size:3rem;font-weight:900;flex-shrink:0;overflow:hidden;border:4px solid #fff;box-shadow:0 10px 40px rgba(185,28,28,0.2);cursor:pointer;position:relative;transition:transform 0.3s,box-shadow 0.3s" title="Click to upload photo" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                                    <span id="donor-card-initials">${initials}</span>
                                    <img id="donor-card-photo-img" src="" alt="" style="display:none;width:100%;height:100%;object-fit:cover;position:absolute;inset:0" />
                                </div>
                            </div>
                        </div>
                        <!-- Name & info centered below photo -->
                        <div style="text-align:center;padding:1.2rem 1rem 0.15rem">
                            <div style="font-size:1.3rem;font-weight:800;color:#1f2937;line-height:1.2;letter-spacing:-0.01em">${name}</div>
                            <div style="font-size:0.72rem;color:#6b7280;margin-top:4px;letter-spacing:0.01em">${email}</div>
                            ${gender !== '—' ? '<div style="font-size:0.7rem;color:#9ca3af;font-weight:600;margin-top:4px;letter-spacing:0.02em">' + gender + (ageDisplay !== '—' ? ' &bull; ' + ageDisplay : '') + '</div>' : (ageDisplay !== '—' ? '<div style="font-size:0.7rem;color:#9ca3af;font-weight:600;margin-top:4px">' + ageDisplay + '</div>' : '')}
                        </div>
                        <!-- Blood group badge centered -->
                        <div style="display:flex;justify-content:center;padding:0.25rem 0 0.2rem">
                            <div style="background:linear-gradient(135deg,#b91c1c,#dc2626,#ef4444);color:#fff;font-size:1.5rem;font-weight:900;padding:0.4rem 1.4rem;border-radius:0.8rem;letter-spacing:0.04em;line-height:1;box-shadow:0 6px 20px rgba(185,28,28,0.22),inset 0 1px 0 rgba(255,255,255,0.15)">${blood}</div>
                        </div>
                        <!-- Divider -->
                        <div style="margin:0.25rem 1.5rem;height:1px;background:linear-gradient(90deg,transparent,rgba(220,38,38,0.1),transparent)"></div>
                        <!-- Info rows (vertical, stacked) -->
                        <div style="padding:0.1rem 1rem 0.1rem;display:flex;flex-direction:column;gap:0.2rem">
                            <div style="display:flex;align-items:center;gap:0.6rem;padding:0.4rem 0.75rem;border-radius:0.7rem;background:rgba(254,242,242,0.45);transition:background 0.2s">
                                <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.06));display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-location-dot" style="color:#dc2626;font-size:0.75rem"></i></div>
                                <div style="min-width:0;flex:1"><div style="font-size:0.56rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#b0b0b0">Location</div><div style="font-size:0.9rem;font-weight:700;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${location}</div></div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.6rem;padding:0.4rem 0.75rem;border-radius:0.7rem;background:rgba(252,231,243,0.3);transition:background 0.2s">
                                <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.06));display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-phone" style="color:#dc2626;font-size:0.75rem"></i></div>
                                <div style="min-width:0;flex:1"><div style="font-size:0.56rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#b0b0b0">Phone</div><div style="font-size:0.9rem;font-weight:700;color:#1f2937">${phone}</div></div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.6rem;padding:0.4rem 0.75rem;border-radius:0.7rem;background:rgba(254,242,242,0.45);transition:background 0.2s">
                                <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.06));display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-calendar-days" style="color:#dc2626;font-size:0.75rem"></i></div>
                                <div style="min-width:0;flex:1"><div style="font-size:0.56rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#b0b0b0">Last Donation</div><div style="font-size:0.9rem;font-weight:700;color:#1f2937">${lastDonate}</div></div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.6rem;padding:0.4rem 0.75rem;border-radius:0.7rem;background:rgba(252,231,243,0.3);transition:background 0.2s">
                                <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(16,185,129,0.06));display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-calendar-check" style="color:#059669;font-size:0.75rem"></i></div>
                                <div style="min-width:0;flex:1"><div style="font-size:0.56rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#b0b0b0">Next Eligible</div><div style="font-size:0.9rem;font-weight:700;color:#1f2937">${nextEligible}</div></div>
                            </div>
                            <div style="display:flex;align-items:center;gap:0.6rem;padding:0.4rem 0.75rem;border-radius:0.7rem;background:rgba(254,242,242,0.45);transition:background 0.2s">
                                <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(99,102,241,0.06));display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-user-clock" style="color:#6366f1;font-size:0.75rem"></i></div>
                                <div style="min-width:0;flex:1"><div style="font-size:0.56rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#b0b0b0">Member Since</div><div style="font-size:0.9rem;font-weight:700;color:#1f2937">${memberSince}</div></div>
                            </div>
                        </div>
                        <!-- Footer -->
                        <div style="display:flex;align-items:center;justify-content:center;padding:0.3rem 1rem;background:linear-gradient(135deg,rgba(185,28,28,0.05),rgba(249,115,22,0.03));border-top:1px solid rgba(220,38,38,0.04)">
                            <span style="font-size:0.65rem;font-weight:700;color:#dc2626;letter-spacing:0.08em"><i class="fa-solid fa-heart" style="margin-right:5px;font-size:0.6rem"></i>Donate Blood, Save Life</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Upload + download area -->
            <div class="flex flex-col items-center gap-2.5 w-full" style="max-width:min(22rem,100%)">
                <label id="donor-card-upload-label" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.55rem 1.2rem;border-radius:0.8rem;border:1.5px dashed rgba(220,38,38,0.3);background:rgba(254,242,242,0.6);color:#dc2626;font-size:0.82rem;font-weight:600;cursor:pointer;transition:all 0.25s" onmouseover="this.style.borderColor='#dc2626';this.style.background='#fef2f2';this.style.transform='translateY(-1px)'" onmouseout="this.style.borderColor='rgba(220,38,38,0.3)';this.style.background='rgba(254,242,242,0.6)';this.style.transform='translateY(0)'">
                    <i class="fa-solid fa-camera"></i>
                    <span id="donor-card-upload-text">Upload Photo</span>
                    <input type="file" id="donor-card-photo-input" accept="image/*" style="display:none" />
                </label>
                <button id="donor-card-download-btn" onclick="window.__downloadDonorCard()" disabled style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.55rem 1.5rem;border-radius:0.8rem;background:#d1d5db;color:#fff;font-size:0.85rem;font-weight:700;border:none;cursor:not-allowed;box-shadow:none;transition:all 0.25s;opacity:0.7">
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

        // Auto-load saved profile photo from DB
        if (donorData.profilePhoto) {
            if (photoImg) {
                photoImg.src = donorData.profilePhoto;
                photoImg.style.display = 'block';
            }
            if (initialsEl) initialsEl.style.display = 'none';
            if (uploadText) uploadText.textContent = 'Change Photo';
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
            if (hint) { hint.style.color = '#10b981'; hint.innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right:3px"></i>Profile photo loaded! You can download your card.'; }
        }

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
        const W = 420, H = 770;
        const canvas = document.createElement('canvas');
        canvas.width = W * SCALE; canvas.height = H * SCALE;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(SCALE, SCALE);

        // ── Background ──
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
        // Subtle warm gradient overlay on body
        const bodyGrad = ctx.createLinearGradient(0, 0, 0, H);
        bodyGrad.addColorStop(0, 'rgba(255,255,255,0)');
        bodyGrad.addColorStop(0.6, 'rgba(255,251,251,0.5)');
        bodyGrad.addColorStop(1, 'rgba(254,248,248,0.8)');
        ctx.fillStyle = bodyGrad; ctx.fillRect(0, 0, W, H);

        // ── Photo geometry (computed first) ──
        const headerH = 120;
        const photoS = 160;
        const photoX = (W - photoS) / 2;
        const photoY = 72;
        const photoCX = photoX + photoS / 2;
        const photoCY = photoY + photoS / 2;
        const photoR = photoS / 2;

        // 1) Draw outer decorative ring & white backing (BELOW header in z-order)
        ctx.strokeStyle = 'rgba(220,38,38,0.06)'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(photoCX, photoCY, photoR + 12, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(photoCX, photoCY, photoR + 6, 0, Math.PI * 2); ctx.fill();

        // 2) Draw header band ON TOP — covers the white backing inside header area
        const hGrad = ctx.createLinearGradient(0, 0, W, 0);
        hGrad.addColorStop(0, '#b91c1c'); hGrad.addColorStop(0.35, '#dc2626'); hGrad.addColorStop(0.65, '#ef4444'); hGrad.addColorStop(1, '#f97316');
        ctx.fillStyle = hGrad; ctx.fillRect(0, 0, W, headerH);

        // Decorative circles on header
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath(); ctx.arc(W - 35, -15, 90, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath(); ctx.arc(40, headerH + 10, 60, 0, Math.PI * 2); ctx.fill();

        // 3) Draw photo border ring & gradient circle ON TOP of header
        ctx.strokeStyle = 'rgba(220,38,38,0.15)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(photoCX, photoCY, photoR + 3, 0, Math.PI * 2); ctx.stroke();

        // Photo circle gradient background
        ctx.save();
        ctx.beginPath(); ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2); ctx.clip();
        const circGrad = ctx.createLinearGradient(photoX, photoY, photoX + photoS, photoY + photoS);
        circGrad.addColorStop(0, '#fecaca'); circGrad.addColorStop(0.5, '#fef2f2'); circGrad.addColorStop(1, '#ffe4e6');
        ctx.fillStyle = circGrad;
        ctx.fillRect(photoX, photoY, photoS, photoS);
        ctx.restore();

        // 4) Header text (drawn LAST so it's on top of everything)
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '700 9px Arial, sans-serif';
        ctx.fillText('BLOOD DONATION COMMUNITY', W / 2, 24);
        ctx.fillStyle = '#ffffff'; ctx.font = '900 18px Arial, sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
        ctx.fillText('DONOR CARD', W / 2, 46);
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

        // ── Computed values ──
        let nextEligible = '--';
        if (donorData.lastDonateDate) {
            const last = new Date(donorData.lastDonateDate + 'T00:00:00');
            const nextDate = new Date(last.getTime() + 90 * 24 * 60 * 60 * 1000);
            if (nextDate <= new Date()) { nextEligible = 'Eligible Now'; }
            else { const _p = n => String(n).padStart(2, '0'); nextEligible = `${_p(nextDate.getDate())}/${_p(nextDate.getMonth() + 1)}/${nextDate.getFullYear()}`; }
        }
        let ageDisplay = '--';
        if (donorData.dateOfBirth) {
            const dob = new Date(donorData.dateOfBirth + 'T00:00:00');
            const now = new Date();
            let age = now.getFullYear() - dob.getFullYear();
            if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
            ageDisplay = age + ' years';
        }
        const lastD = donorData.lastDonateDate
            ? (() => { const _d = new Date(donorData.lastDonateDate + 'T00:00:00'); const _p = n => String(n).padStart(2, '0'); return `${_p(_d.getDate())}/${_p(_d.getMonth() + 1)}/${_d.getFullYear()}`; })()
            : 'Not recorded';
        const donorName = donorData.fullName || 'Donor';

        // ── Icon drawing helpers ──
        const drawLocationPin = (cx, cy, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx, cy - 2, 4.5, Math.PI, 0);
            ctx.lineTo(cx, cy + 7);
            ctx.closePath();
            ctx.fill();
            // Inner circle
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
        };

        const drawPhoneIcon = (cx, cy, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(cx - 3.5, cy - 5.5, 7, 11, 1.5);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx, cy + 3, 1, 0, Math.PI * 2); ctx.fill();
            ctx.fillRect(cx - 2, cy - 4, 4, 5);
        };

        const drawCalendarIcon = (cx, cy, color) => {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.roundRect(cx - 5.5, cy - 4, 11, 10, 1.5); ctx.fill();
            // Top bar
            ctx.fillStyle = color;
            ctx.fillRect(cx - 5.5, cy - 4, 11, 3.5);
            // Handles
            ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(cx - 2.5, cy - 5.5); ctx.lineTo(cx - 2.5, cy - 3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 2.5, cy - 5.5); ctx.lineTo(cx + 2.5, cy - 3); ctx.stroke();
            // Grid dots
            ctx.fillStyle = '#fff';
            ctx.fillRect(cx - 3.5, cy + 0.5, 2, 1.5);
            ctx.fillRect(cx - 0.5, cy + 0.5, 2, 1.5);
            ctx.fillRect(cx + 2, cy + 0.5, 2, 1.5);
            ctx.fillRect(cx - 3.5, cy + 3, 2, 1.5);
            ctx.fillRect(cx - 0.5, cy + 3, 2, 1.5);
        };

        const drawCalendarCheckIcon = (cx, cy, color) => {
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.roundRect(cx - 5.5, cy - 4, 11, 10, 1.5); ctx.fill();
            ctx.fillRect(cx - 5.5, cy - 4, 11, 3.5);
            ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(cx - 2.5, cy - 5.5); ctx.lineTo(cx - 2.5, cy - 3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 2.5, cy - 5.5); ctx.lineTo(cx + 2.5, cy - 3); ctx.stroke();
            // Checkmark
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
            ctx.beginPath(); ctx.moveTo(cx - 2.5, cy + 2); ctx.lineTo(cx - 0.5, cy + 4); ctx.lineTo(cx + 3, cy + 0.5); ctx.stroke();
        };

        const drawHeartShape = (cx, cy, size, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            const s = size;
            ctx.moveTo(cx, cy + s * 0.4);
            ctx.bezierCurveTo(cx - s * 0.5, cy - s * 0.1, cx - s * 0.5, cy - s * 0.5, cx - s * 0.25, cy - s * 0.5);
            ctx.bezierCurveTo(cx - s * 0.05, cy - s * 0.5, cx, cy - s * 0.25, cx, cy - s * 0.1);
            ctx.bezierCurveTo(cx, cy - s * 0.25, cx + s * 0.05, cy - s * 0.5, cx + s * 0.25, cy - s * 0.5);
            ctx.bezierCurveTo(cx + s * 0.5, cy - s * 0.5, cx + s * 0.5, cy - s * 0.1, cx, cy + s * 0.4);
            ctx.fill();
        };

        const drawRest = () => {
            // ── Name ──
            const nameY = photoY + photoS + 40;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#1f2937';
            ctx.font = '800 22px Arial, Helvetica, sans-serif';
            ctx.fillText(String(donorName), W / 2, nameY);

            // ── Email ──
            ctx.fillStyle = '#6b7280';
            ctx.font = '400 11.5px Arial, Helvetica, sans-serif';
            ctx.fillText(String(donorData.email || '--'), W / 2, nameY + 20);

            // ── Gender & Age ──
            let subLine = '';
            const genderVal = donorData.gender || '';
            if (genderVal && genderVal !== '--' && genderVal !== '\u2014') subLine += genderVal;
            if (ageDisplay !== '--') subLine += (subLine ? ' \u2022 ' : '') + ageDisplay;
            if (subLine) {
                ctx.fillStyle = '#9ca3af';
                ctx.font = '600 10.5px Arial, Helvetica, sans-serif';
                ctx.fillText(subLine, W / 2, nameY + 36);
            }

            // ── Blood group badge ──
            const badgeW = 84, badgeH = 36;
            const badgeX = (W - badgeW) / 2, badgeY = nameY + 50;
            const bGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
            bGrad.addColorStop(0, '#b91c1c'); bGrad.addColorStop(0.5, '#dc2626'); bGrad.addColorStop(1, '#ef4444');
            ctx.fillStyle = bGrad;
            ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 9); ctx.fill();
            // Subtle inner highlight
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(badgeX, badgeY, badgeW, badgeH / 2);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 20px Arial, Helvetica, sans-serif';
            ctx.fillText(String(donorData.bloodGroup || '--'), W / 2, badgeY + badgeH / 2);
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

            // ── Divider ──
            const divY = badgeY + badgeH + 14;
            const divGrad = ctx.createLinearGradient(50, 0, W - 50, 0);
            divGrad.addColorStop(0, 'rgba(220,38,38,0)'); divGrad.addColorStop(0.5, 'rgba(220,38,38,0.1)'); divGrad.addColorStop(1, 'rgba(220,38,38,0)');
            ctx.fillStyle = divGrad; ctx.fillRect(50, divY, W - 100, 1);

            // ── Info rows with proper icons ──
            const rowX = 28, rowW = W - 56;
            const rowH = 44;
            const rowGap = 5;
            let rY = divY + 12;
            const iconBoxS = 30;

            const drawInfoRow = (label, value, y, bgColor, iconColor, drawIcon) => {
                // Row background
                ctx.fillStyle = bgColor;
                ctx.beginPath(); ctx.roundRect(rowX, y, rowW, rowH, 9); ctx.fill();

                // Icon background box
                const iconBgX = rowX + 10, iconBgY = y + (rowH - iconBoxS) / 2;
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.beginPath(); ctx.roundRect(iconBgX, iconBgY, iconBoxS, iconBoxS, 8); ctx.fill();

                // Icon
                drawIcon(iconBgX + iconBoxS / 2, iconBgY + iconBoxS / 2, iconColor);

                // Label text
                ctx.fillStyle = '#b0b0b0';
                ctx.font = '700 7.5px Arial, Helvetica, sans-serif';
                ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                ctx.fillText(label, rowX + iconBoxS + 18, y + 16);

                // Value text
                ctx.fillStyle = '#1f2937';
                ctx.font = '700 14px Arial, Helvetica, sans-serif';
                ctx.fillText(String(value), rowX + iconBoxS + 18, y + 33);
            };

            drawInfoRow('LOCATION', donorData.location || '--', rY, 'rgba(254,242,242,0.5)', '#dc2626', drawLocationPin);
            rY += rowH + rowGap;
            drawInfoRow('PHONE', donorData.phone || '--', rY, 'rgba(252,231,243,0.3)', '#dc2626', drawPhoneIcon);
            rY += rowH + rowGap;
            drawInfoRow('LAST DONATION', lastD, rY, 'rgba(254,242,242,0.5)', '#dc2626', drawCalendarIcon);
            rY += rowH + rowGap;
            drawInfoRow('NEXT ELIGIBLE', nextEligible, rY, 'rgba(252,231,243,0.3)', '#059669', drawCalendarCheckIcon);
            rY += rowH + rowGap;

            // Member Since (with Firebase Auth metadata fallback)
            let memberSinceCanvas = '--';
            const memberSinceSrcCanvas = donorData.createdAt || donorData.memberSince;
            if (memberSinceSrcCanvas) {
                const _d = new Date(memberSinceSrcCanvas);
                if (!isNaN(_d.getTime())) {
                    const _p = n => String(n).padStart(2, '0');
                    memberSinceCanvas = `${_p(_d.getDate())}/${_p(_d.getMonth() + 1)}/${_d.getFullYear()}`;
                }
            }
            const drawClockIcon = (cx, cy, color) => {
                ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.arc(cx, cy, 5.5, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, cy - 3); ctx.lineTo(cx, cy); ctx.lineTo(cx + 2.5, cy + 1.5); ctx.stroke();
                // Small user silhouette
                ctx.fillStyle = color;
                ctx.beginPath(); ctx.arc(cx - 4, cy - 4, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx - 4, cy - 1.5, 2, Math.PI, 0); ctx.fill();
            };
            drawInfoRow('MEMBER SINCE', memberSinceCanvas, rY, 'rgba(238,242,255,0.5)', '#6366f1', drawClockIcon);

            // ── Footer ──
            const footH = 36;
            const footY = H - footH;
            // Footer background with gradient
            const footGrad = ctx.createLinearGradient(0, footY, 0, H);
            footGrad.addColorStop(0, 'rgba(254,242,242,0.6)');
            footGrad.addColorStop(1, 'rgba(252,231,243,0.4)');
            ctx.fillStyle = footGrad; ctx.fillRect(0, footY, W, footH);
            // Top border line
            ctx.fillStyle = 'rgba(220,38,38,0.06)'; ctx.fillRect(0, footY, W, 1);

            // Heart icon in footer (small, clean)
            const heartX = W / 2 - 72, heartY = footY + footH / 2;
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(heartX, heartY - 1);
            ctx.bezierCurveTo(heartX - 5, heartY - 6, heartX - 9, heartY - 2, heartX, heartY + 5);
            ctx.moveTo(heartX, heartY - 1);
            ctx.bezierCurveTo(heartX + 5, heartY - 6, heartX + 9, heartY - 2, heartX, heartY + 5);
            ctx.fill();

            // Footer text
            ctx.fillStyle = '#b91c1c';
            ctx.font = '700 11px Arial, Helvetica, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('Donate Blood, Save Life', W / 2 + 6, footY + footH / 2);
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

            // ── Outer border ──
            ctx.strokeStyle = 'rgba(220,38,38,0.08)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(1, 1, W - 2, H - 2, 14); ctx.stroke();

            resolve(canvas);
        };

        if (photoSrc) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                ctx.save();
                ctx.beginPath(); ctx.arc(photoCX, photoCY, photoR, 0, Math.PI * 2); ctx.clip();
                ctx.drawImage(img, photoX, photoY, photoS, photoS);
                ctx.restore();
                drawRest();
            };
            img.onerror = () => {
                const init = (donorName).split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();
                ctx.fillStyle = '#b91c1c'; ctx.font = '900 52px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(init, photoCX, photoCY); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                drawRest();
            };
            img.src = photoSrc;
        } else {
            const init = (donorName).split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();
            ctx.fillStyle = '#b91c1c'; ctx.font = '900 52px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(init, photoCX, photoCY); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
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
