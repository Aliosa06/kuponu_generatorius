const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    generateCoupon: (data) => ipcRenderer.invoke('generate-coupon', data),
    savePDF: (svgContent) => ipcRenderer.invoke('save-pdf', svgContent),
    getCoupons: () => ipcRenderer.invoke('get-coupons')
})

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
})
