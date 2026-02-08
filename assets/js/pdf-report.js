export async function loadJsPdf() {
    if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
    await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    return window.jspdf?.jsPDF || null;
}

export function createMonthlyReportDownloader({
    getRecentDonations,
    groupRecentDonationsByMonth,
    chartLabels,
    refreshDashboardCharts,
    ensureDashboardCharts,
    getDonationDetailData,
    formatDateDisplay,
    showModalMessage
}) {
    let isGenerating = false;

    async function downloadMonthlyReportPdf(triggerEl) {
        if (isGenerating) return;
        isGenerating = true;
        if (triggerEl) {
            triggerEl.setAttribute('disabled', 'disabled');
            triggerEl.setAttribute('aria-busy', 'true');
        }
        try {
            refreshDashboardCharts();
            ensureDashboardCharts();
            await new Promise(requestAnimationFrame);
            const jsPdfCtor = await loadJsPdf();
            if (!jsPdfCtor) throw new Error('jsPDF unavailable');
            const donationEntries = getRecentDonations();
            const { monthGroups, undated } = groupRecentDonationsByMonth(donationEntries);
            const monthCounts = monthGroups.map(group => group.length);
            const totalDonations = donationEntries.length;
            const countedByMonths = monthCounts.reduce((sum, value) => sum + Number(value || 0), 0);
            let peakIndex = -1;
            let peakValue = -1;
            monthCounts.forEach((value, idx) => {
                if (Number(value || 0) > peakValue) {
                    peakValue = Number(value || 0);
                    peakIndex = idx;
                }
            });
            const doc = new jsPdfCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const marginX = 20;
            const marginY = 20;
            const bottomMargin = 20;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const contentWidth = pageWidth - marginX * 2;
            let cursorY = marginY;
            const palette = {
                primary: [220, 38, 38],
                text: [33, 37, 41],
                muted: [107, 114, 128],
                panel: [248, 250, 252],
                border: [229, 231, 235]
            };
            const setTextColor = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
            const ensureSpace = (needed = 6) => {
                if (cursorY + needed > pageHeight - bottomMargin) {
                    doc.addPage();
                    cursorY = marginY;
                }
            };
            const ensureEntrySpace = (estimatedHeight = 26) => {
                ensureSpace(estimatedHeight);
            };
            const drawDivider = () => {
                ensureSpace(4);
                doc.setDrawColor(...palette.border);
                doc.setLineWidth(0.3);
                doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
                cursorY += 4;
                doc.setDrawColor(0);
            };
            const drawSectionTitle = (title) => {
                ensureSpace(12);
                doc.setFillColor(...palette.panel);
                doc.rect(marginX, cursorY, contentWidth, 9, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                setTextColor(palette.primary);
                doc.text(title, marginX + 2, cursorY + 6);
                cursorY += 12;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                setTextColor(palette.text);
            };
            const writeSummaryBox = (lines = []) => {
                if (!lines.length) return;
                const boxHeight = lines.length * 5 + 6;
                ensureSpace(boxHeight + 2);
                doc.setFillColor(...palette.panel);
                doc.setDrawColor(...palette.border);
                doc.setLineWidth(0.3);
                doc.rect(marginX, cursorY, contentWidth, boxHeight, 'FD');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                setTextColor(palette.text);
                let y = cursorY + 6;
                lines.forEach(line => {
                    doc.text(line, marginX + 3, y);
                    y += 5;
                });
                cursorY += boxHeight + 2;
                doc.setDrawColor(0);
            };
            const drawMonthHeader = (label, yearText, count, firstEntryHeight = 50) => {
                ensureSpace(13 + firstEntryHeight);
                doc.setFillColor(252, 231, 233);
                doc.rect(marginX, cursorY, contentWidth, 9, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                setTextColor(palette.primary);
                const headerText = `${label} ${yearText ? yearText + ' ' : ''}(${count})`;
                doc.text(headerText, marginX + 2, cursorY + 6.5);
                cursorY += 13;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                setTextColor(palette.text);
            };
            const writeWrappedText = (text, indent = 0, lineGap = 6) => {
                const segments = doc.splitTextToSize(String(text), contentWidth - indent);
                segments.forEach(segment => {
                    ensureSpace(lineGap);
                    doc.text(segment, marginX + indent, cursorY);
                    cursorY += lineGap;
                });
            };
            const writeInlineSegments = (segments, indent = 0, lineGap = 5) => {
                ensureSpace(lineGap);
                let currentX = marginX + indent;
                segments.forEach(segment => {
                    if (!segment) return;
                    const text = (segment.text ?? '').toString();
                    if (!text) return;
                    const isBold = !!segment.bold;
                    const color = Array.isArray(segment.color) ? segment.color : palette.text;
                    doc.setTextColor(color[0], color[1], color[2]);
                    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                    doc.text(text, currentX, cursorY);
                    currentX += doc.getTextWidth(text);
                });
                cursorY += lineGap;
                doc.setFont('helvetica', 'normal');
                setTextColor(palette.text);
            };
            const addGap = (gap = 6) => {
                ensureSpace(gap);
                cursorY += gap;
            };
            const writeDonationEntry = (entryNumber, detail) => {
                if (!detail) return;
                const firstLineSegments = [
                    { text: `${entryNumber}. `, bold: true },
                    { text: `${detail.displayDate} - `, bold: false },
                    { text: `${detail.donorName} `, bold: true }
                ];
                if (detail.bloodGroup && detail.bloodGroup !== '—') {
                    firstLineSegments.push({ text: '(', bold: false });
                    firstLineSegments.push({ text: 'Blood Group: ', bold: true, color: palette.primary });
                    firstLineSegments.push({ text: `${detail.bloodGroup}`, bold: true, color: palette.primary });
                    firstLineSegments.push({ text: ')', bold: false });
                }
                writeInlineSegments(firstLineSegments, 0, 6);
                const locationSegments = [
                    { text: 'Location: ', bold: true },
                    { text: detail.location || '—', bold: false },
                    { text: ' | ', bold: false },
                    { text: 'Department: ', bold: true },
                    { text: detail.department || '—', bold: false }
                ];
                writeInlineSegments(locationSegments, 8, 5);
                const batchAgeWeightSegments = [
                    { text: 'Batch: ', bold: true },
                    { text: detail.batch || '—', bold: false },
                    { text: ' | ', bold: false },
                    { text: 'Age: ', bold: true },
                    { text: detail.age || '—', bold: false },
                    { text: ' | ', bold: false },
                    { text: 'Weight: ', bold: true },
                    { text: detail.weight || '—', bold: false }
                ];
                writeInlineSegments(batchAgeWeightSegments, 8, 5);
                if (detail.notes) {
                    writeInlineSegments([
                        { text: 'Notes: ', bold: true },
                        { text: detail.notes, bold: false }
                    ], 8, 5);
                }
                if (detail.comment) {
                    writeInlineSegments([
                        { text: 'Comment: ', bold: true },
                        { text: detail.comment, bold: false }
                    ], 8, 5);
                }
            };
            const now = new Date();
            const drawReportHeader = () => {
                ensureSpace(20);
                doc.setFillColor(...palette.primary);
                doc.rect(marginX, cursorY, contentWidth, 14, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.setTextColor(255, 255, 255);
                doc.text('Monthly Blood Donation Report', marginX + 4, cursorY + 9);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.text(`Generated on ${now.toLocaleString()}`, marginX + 4, cursorY + 13);
                cursorY += 16;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                setTextColor(palette.text);
                addGap(2);
            };
            drawReportHeader();
            
            const yearGroups = {};
            donationEntries.forEach(entry => {
                if (!entry) return;
                const rawDate = entry.date || entry.donationDate;
                const dateObj = rawDate ? new Date(rawDate) : null;
                if (!dateObj || Number.isNaN(dateObj.getTime())) return;
                const year = dateObj.getFullYear();
                if (!yearGroups[year]) yearGroups[year] = [];
                yearGroups[year].push(entry);
            });
            
            const sortedYears = Object.keys(yearGroups).map(Number).sort((a, b) => a - b);
            
            const yearlyCounts = sortedYears.map(year => ({
                year,
                count: yearGroups[year].length
            }));
            
            const summaryLines = [
                `Total donations: ${totalDonations}`,
                `Matched to months: ${countedByMonths}/${totalDonations || 0}`,
                `Entries without date: ${undated.length}`,
                peakIndex >= 0 && peakValue > 0 ? `Peak month: ${chartLabels.months[peakIndex]} (${peakValue})` : 'Peak month: No monthly records'
            ];
            writeSummaryBox(summaryLines);
            
            drawSectionTitle('Yearly Summary');
            yearlyCounts.forEach(({ year, count }) => {
                writeWrappedText(`${year}: ${count} donation${count !== 1 ? 's' : ''}`, 6, 5);
            });
            if (yearlyCounts.length === 0) {
                writeWrappedText('No yearly data available', 6, 5);
            }
            addGap(6);
            
            drawSectionTitle('Monthly Summary');
            if (sortedYears.length > 0) {
                const yearlyMonthData = sortedYears.map(year => {
                    const yearDonations = yearGroups[year];
                    const monthlyCountsForYear = chartLabels.months.map(() => 0);
                    yearDonations.forEach(entry => {
                        const rawDate = entry.date || entry.donationDate;
                        const dateObj = rawDate ? new Date(rawDate) : null;
                        if (dateObj && !Number.isNaN(dateObj.getTime())) {
                            monthlyCountsForYear[dateObj.getMonth()]++;
                        }
                    });
                    return { year, counts: monthlyCountsForYear };
                });
                
                const colWidth = (contentWidth - 30) / sortedYears.length;
                const tableStartX = marginX;
                const monthColWidth = 30;
                
                ensureSpace(12);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                setTextColor(palette.text);
                doc.text('Month', tableStartX + 2, cursorY);
                sortedYears.forEach((year, idx) => {
                    doc.setTextColor(...palette.primary);
                    doc.text(String(year), tableStartX + monthColWidth + (idx * colWidth) + colWidth / 2 - 10, cursorY);
                });
                cursorY += 6;
                
                doc.setDrawColor(...palette.border);
                doc.setLineWidth(0.3);
                doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
                cursorY += 3;
                
                doc.setFont('helvetica', 'normal');
                chartLabels.months.forEach((month, monthIdx) => {
                    ensureSpace(6);
                    setTextColor(palette.text);
                    doc.text(month, tableStartX + 2, cursorY);
                    
                    yearlyMonthData.forEach((yearData, yearIdx) => {
                        const count = yearData.counts[monthIdx];
                        const displayValue = count === 0 ? 'No Donation' : String(count);
                        const textColor = count === 0 ? palette.muted : palette.text;
                        doc.setTextColor(...textColor);
                        doc.text(displayValue, tableStartX + monthColWidth + (yearIdx * colWidth) + colWidth / 2 - 10, cursorY);
                    });
                    cursorY += 5;
                });
                
                setTextColor(palette.text);
            } else {
                writeWrappedText('No monthly data available', 6, 5);
            }
            addGap(6);
            
            drawSectionTitle('Donation details by date');
            let printedAnyDetails = false;
            
            sortedYears.forEach(year => {
                const yearDonations = yearGroups[year];
                
                const monthGroupsForYear = chartLabels.months.map(() => []);
                yearDonations.forEach(entry => {
                    const rawDate = entry.date || entry.donationDate;
                    const dateObj = rawDate ? new Date(rawDate) : null;
                    if (dateObj && !Number.isNaN(dateObj.getTime())) {
                        monthGroupsForYear[dateObj.getMonth()].push({ donation: entry, dateObj });
                    }
                });
                
                monthGroupsForYear.forEach(group => {
                    group.sort((a, b) => {
                        const aTime = a.dateObj ? a.dateObj.getTime() : 0;
                        const bTime = b.dateObj ? b.dateObj.getTime() : 0;
                        return aTime - bTime; // ascending order
                    });
                });
                
                monthGroupsForYear.forEach((entries, idx) => {
                    if (!entries.length) return;
                    printedAnyDetails = true;
                    
                    const firstEntry = entries[0];
                    const firstHasNotes = Boolean((firstEntry?.donation?.notes ?? '').toString().trim());
                    const firstHasComment = Boolean((firstEntry?.donation?.publicComment ?? '').toString().trim());
                    const firstEntryHeight = 24 + 12 + (firstHasNotes ? 8 : 0) + (firstHasComment ? 8 : 0) + 10;
                    
                    drawMonthHeader(chartLabels.months[idx], String(year), entries.length, firstEntryHeight);
                    entries.forEach(({ donation, dateObj }, entryIdx) => {
                        const hasNotes = Boolean((donation?.notes ?? '').toString().trim());
                        const hasComment = Boolean((donation?.publicComment ?? '').toString().trim());
                        const estimated = 24 + 12 + (hasNotes ? 8 : 0) + (hasComment ? 8 : 0) + 10;
                        if (entryIdx > 0) {
                            ensureEntrySpace(estimated);
                        }
                        const detail = getDonationDetailData(donation, dateObj) || {
                            displayDate: formatDateDisplay(dateObj),
                            donorName: donation?.name || 'Details unavailable',
                            bloodGroup: donation?.bloodGroup || '—',
                            location: '—',
                            department: '—',
                            batch: '—',
                            age: '—',
                            weight: '—',
                            notes: '',
                            comment: ''
                        };
                        writeDonationEntry(entryIdx + 1, detail);
                        addGap(4);
                        drawDivider();
                    });
                    addGap(6);
                });
            });
            if (undated.length) {
                drawSectionTitle(`No Date Provided (${undated.length})`);
                undated.forEach(({ donation }, entryIdx) => {
                    const detail = getDonationDetailData(donation, null) || {
                        displayDate: '—',
                        donorName: donation?.name || 'Details unavailable',
                        bloodGroup: donation?.bloodGroup || '—',
                        location: '—',
                        department: '—',
                        batch: '—',
                        age: '—',
                        weight: '—',
                        notes: '',
                        comment: ''
                    };
                    writeDonationEntry(entryIdx + 1, detail);
                    addGap(2);
                    drawDivider();
                });
                addGap(4);
            }
            if (!printedAnyDetails && !undated.length) {
                writeWrappedText('No donation entries are available for the selected period.', 0, 6);
            }
            const fileName = `monthly-donation-report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error('Failed to generate monthly report:', error);
            showModalMessage('success-modal', 'Unable to generate monthly report. Please try again.', 'Error');
        } finally {
            if (triggerEl) {
                triggerEl.removeAttribute('disabled');
                triggerEl.removeAttribute('aria-busy');
            }
            isGenerating = false;
        }
    }

    return downloadMonthlyReportPdf;
}
