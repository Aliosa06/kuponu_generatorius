const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

const couponsFile = path.join(__dirname, 'coupons.json')

// Ensure coupons.json exists
if (!fs.existsSync(couponsFile)) {
    fs.writeFileSync(couponsFile, JSON.stringify([]))
}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    ipcMain.handle('generate-coupon', async (event, { amount, validUntil }) => {
        try {
        
            const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();
            const code = `ETS-${amount}-${uniqueId}`;

          
            const svgPath = path.join(__dirname, 'pic', `ETS_${amount}.svg`);
            let svgContent = fs.readFileSync(svgPath, 'utf8');

            
            const textElement = `
                <text x="437" y="457" dominant-baseline="middle" text-anchor="middle" 
                      font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#333333">
                    ${code}
                </text>
                <text x="620" y="415" dominant-baseline="middle" text-anchor="middle" 
                      font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">
                    ${validUntil}
                </text>
               
            `;

           
            const modifiedSvg = svgContent.replace('</svg>', `${textElement}</svg>`);

         
            const couponData = {
                id: uniqueId,
                code,
                amount,
                validUntil,
                createdAt: new Date().toISOString(),
                used: false
            };

            const existingData = JSON.parse(fs.readFileSync(couponsFile, 'utf8'));
            existingData.push(couponData);
            fs.writeFileSync(couponsFile, JSON.stringify(existingData, null, 2));

            return { success: true, svg: modifiedSvg, code };
        } catch (error) {
            console.error('Error generating coupon:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('save-pdf', async (event, svgContent) => {
        try {
          
            const printWin = new BrowserWindow({
                show: false,
                width: 874,
                height: 614,
                webPreferences: {
                    offscreen: true
                }
            });

            const base64Svg = Buffer.from(svgContent).toString('base64');
            const dataUri = `data:image/svg+xml;base64,${base64Svg}`;

            await printWin.loadURL(dataUri);

         
            const pdfData = await printWin.webContents.printToPDF({
                printBackground: true,
                landscape: true, 
                pageSize: 'A4', 
                margins: { top: 0, bottom: 0, left: 0, right: 0 }
            });

            printWin.close();

           
            const { filePath } = await dialog.showSaveDialog({
                title: 'Save Coupon PDF',
                defaultPath: path.join(app.getPath('desktop'), `coupon-${Date.now()}.pdf`),
                filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
            });

            if (filePath) {
                fs.writeFileSync(filePath, pdfData);
                return { success: true, filePath };
            } else {
                return { success: false, error: 'Cancelled' };
            }

        } catch (error) {
            console.error('Error saving PDF:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-coupons', async () => {
        try {
            const data = fs.readFileSync(couponsFile, 'utf8');
            return { success: true, coupons: JSON.parse(data) };
        } catch (error) {
            console.error('Error reading coupons:', error);
            return { success: false, error: error.message };
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
