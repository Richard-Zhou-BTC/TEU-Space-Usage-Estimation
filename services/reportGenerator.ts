
import { Container } from '../types';

declare const window: any;

export const generateEngineeringReport = async (container: Container) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const MARGIN = 10;
    const SCALE = 200 / container.length; 
    const containerW_mm = container.length * SCALE;
    const containerD_mm = container.width * SCALE;
    const containerH_mm = container.height * SCALE;

    const drawBoxRect = (pdfX: number, pdfY: number, w: number, h: number, id: number, colorHex: string) => {
        doc.setDrawColor(50);
        doc.setLineWidth(0.1);
        doc.setFillColor(colorHex); 
        doc.rect(pdfX, pdfY, w, h, 'FD');
        if (w > 4 && h > 4) { 
            doc.setFontSize(6);
            doc.setTextColor(0);
            doc.text(`${id}`, pdfX + (w/2), pdfY + (h/2), { align: 'center', baseline: 'middle' });
        }
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Loading Plan - Container #${container.id}`, MARGIN, MARGIN + 5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Strategy: Interlocking & Gradient Descent`, MARGIN, MARGIN + 12);

    // TOP VIEW
    const topViewY = MARGIN + 25;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 150);
    doc.text("Top View (Showing Interlocking Layout)", MARGIN, topViewY - 2);
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, topViewY, containerW_mm, containerD_mm);

    container.items.forEach(item => {
        const itemL = item.rotation ? item.dimensions.width : item.dimensions.length;
        const itemW = item.rotation ? item.dimensions.length : item.dimensions.width;
        const x = MARGIN + (item.position.x * SCALE);
        const y = topViewY + (containerD_mm - (item.position.z * SCALE) - (itemW * SCALE));
        drawBoxRect(x, y, itemL * SCALE, itemW * SCALE, item.id, '#f1f5f9');
    });

    // FRONT VIEW
    const frontViewY = topViewY + containerD_mm + 20;
    doc.text("Side View (Longitudinal Section)", MARGIN, frontViewY - 2);
    doc.rect(MARGIN, frontViewY, containerW_mm, containerH_mm);

    container.items.forEach(item => {
        const itemL = item.rotation ? item.dimensions.width : item.dimensions.length;
        const itemH = item.dimensions.height;
        const x = MARGIN + (item.position.x * SCALE);
        const y = frontViewY + (containerH_mm - (item.position.y * SCALE) - (itemH * SCALE));
        drawBoxRect(x, y, itemL * SCALE, itemH * SCALE, item.id, '#f1f5f9');
    });

    doc.addPage();
    doc.setFontSize(16);
    doc.text("Stability Optimization Log", MARGIN, MARGIN + 10);
    
    const logs = [
        "1. Interlocking Pattern: Disabled rigid grid alignment to allow overlapping placement.",
        "2. Surface Contact Priority: Maximized friction area between adjacent wooden boxes.",
        "3. Staggered Pillars: Avoided continuous vertical seams to prevent load shifting.",
        "4. Anti-Shear Logic: Boxes now cross-link between different longitudinal sections."
    ];
    let curY = MARGIN + 25;
    logs.forEach(l => {
        doc.text(l, MARGIN, curY);
        curY += 10;
    });

    doc.save(`Loading_Interlocked_${container.id}.pdf`);
};
