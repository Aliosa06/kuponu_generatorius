const form = document.getElementById('coupon-form');
const previewContainer = document.getElementById('preview-container');
const couponPreview = document.getElementById('coupon-preview');
const savePdfBtn = document.getElementById('save-pdf-btn');

let currentSvgContent = null;

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const amount = formData.get('amount');
    const validUntil = formData.get('validUntil');

    console.log('Generating coupon:', { amount, validUntil });

    try {
        const result = await window.electronAPI.generateCoupon({ amount, validUntil });

        if (result.success) {
            currentSvgContent = result.svg;

            // Display SVG
            couponPreview.innerHTML = result.svg;

            // Adjust SVG size for preview
            const svgElement = couponPreview.querySelector('svg');
            if (svgElement) {
                svgElement.style.width = '100%';
                svgElement.style.height = 'auto';
            }

            previewContainer.style.display = 'block';

            // Scroll to preview
            previewContainer.scrollIntoView({ behavior: 'smooth' });

            alert(`Coupon generated! Code: ${result.code}`);
        } else {
            alert('Error generating coupon: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('An unexpected error occurred.');
    }
});

savePdfBtn.addEventListener('click', async () => {
    if (!currentSvgContent) return;

    try {
        const result = await window.electronAPI.savePDF(currentSvgContent);
        if (result.success) {
            alert('PDF saved successfully to: ' + result.filePath);
            // Return to main screen: hide preview, reset form, clear SVG content
            previewContainer.style.display = 'none';
            form.reset();
            currentSvgContent = null;
        } else if (result.error !== 'Cancelled') {
            alert('Error saving PDF: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Failed to save PDF.');
    }
});

// View Coupons List
const viewCouponsBtn = document.getElementById('view-coupons-btn');
const couponsListContainer = document.getElementById('coupons-list-container');
const couponsList = document.getElementById('coupons-list');
const closeListBtn = document.getElementById('close-list-btn');

viewCouponsBtn.addEventListener('click', async () => {
    try {
        const result = await window.electronAPI.getCoupons();
        if (result.success) {
            const coupons = result.coupons;

            if (coupons.length === 0) {
                couponsList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No coupons generated yet.</p>';
            } else {
                couponsList.innerHTML = coupons.map(coupon => `
                    <div style="background: rgba(255, 255, 255, 0.6); border-radius: 12px; padding: 1rem; margin-bottom: 0.75rem; border: 2px solid rgba(255, 255, 255, 0.8);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <strong style="font-size: 1.1rem; color: var(--primary-color);">${coupon.code}</strong>
                            <span style="padding: 0.25rem 0.75rem; background: ${coupon.used ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)'}; color: white; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                                ${coupon.used ? 'Used' : 'Active'}
                            </span>
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-muted);">
                            <div>Amount: <strong>${coupon.amount}€</strong></div>
                            <div>Valid Until: <strong>${coupon.validUntil}</strong></div>
                            <div>Created: <strong>${new Date(coupon.createdAt).toLocaleDateString()}</strong></div>
                        </div>
                    </div>
                `).join('');
            }

            couponsListContainer.style.display = 'block';
            couponsListContainer.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Error loading coupons: ' + result.error);
        }
    } catch (error) {
        console.error(error);
        alert('Failed to load coupons.');
    }
});

closeListBtn.addEventListener('click', () => {
    couponsListContainer.style.display = 'none';
});
