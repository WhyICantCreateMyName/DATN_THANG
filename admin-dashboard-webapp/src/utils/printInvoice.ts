export interface PrintInvoiceData {
    tableName: string;
    orders: any[];
    totals: {
        subTotal: number;
        totalDiscount: number;
        finalTotal: number;
    };
    paymentMethod: string;
}

export const printInvoice = (data: PrintInvoiceData) => {
    const { tableName, orders, totals, paymentMethod } = data;
    const { subTotal, totalDiscount, finalTotal } = totals;

    // Phẳng hóa danh sách món ăn từ các orders (gộp trùng tên món ăn)
    const itemsMap: { [key: string]: { name: string; quantity: number; price: number } } = {};
    orders.forEach(order => {
        order.items.forEach((item: any) => {
            const name = item.menuItem.name;
            const price = item.priceAtTime || item.menuItem.price || 0;
            const key = `${name}_${price}`;
            if (itemsMap[key]) {
                itemsMap[key].quantity += item.quantity;
            } else {
                itemsMap[key] = {
                    name,
                    quantity: item.quantity,
                    price
                };
            }
        });
    });

    const items = Object.values(itemsMap);
    const dateStr = new Date().toLocaleString('vi-VN');
    const invoiceCode = `HD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const getPaymentMethodLabel = (method: string) => {
        switch (method) {
            case 'VNPAY': return 'VNPay QR';
            case 'MOMO': return 'Ví MoMo';
            case 'CASH': return 'Tiền mặt';
            default: return 'Chuyển khoản';
        }
    };

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>In Hóa Đơn</title>
            <meta charset="utf-8" />
            <style>
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                body {
                    width: 74mm;
                    margin: 0 auto;
                    padding: 4mm 2mm;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #000;
                    background: #fff;
                }
                .center {
                    text-align: center;
                }
                .bold {
                    font-weight: bold;
                }
                .uppercase {
                    text-transform: uppercase;
                }
                .title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 2px;
                }
                .subtitle {
                    font-size: 10px;
                    margin-bottom: 10px;
                }
                .divider {
                    border-top: 1px dashed #000;
                    margin: 8px 0;
                }
                .double-divider {
                    border-top: 2px double #000;
                    margin: 8px 0;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 3px;
                }
                .info-label {
                    color: #555;
                }
                .info-value {
                    font-weight: bold;
                }
                .item-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                }
                .item-table th {
                    font-weight: bold;
                    text-align: left;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 4px;
                }
                .item-table td {
                    padding: 4px 0;
                    vertical-align: top;
                }
                .text-right {
                    text-align: right;
                }
                .text-center {
                    text-align: center;
                }
                .summary-section {
                    margin-top: 10px;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    font-weight: bold;
                    margin-top: 4px;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 10px;
                }
            </style>
        </head>
        <body>
            <div class="center">
                <div class="title uppercase">THẮNG RESTAURANT</div>
                <div class="subtitle">ĐC: 575 Phạm Văn Đồng, phường Cổ Nhuế 1, Bắc Từ Liêm, Hà Nội<br>ĐT: 0987.654.321</div>
                <div class="bold uppercase" style="font-size: 14px; margin-top: 5px;">HÓA ĐƠN THANH TOÁN</div>
                <div style="font-size: 10px;">Mã HĐ: ${invoiceCode}</div>
            </div>

            <div class="divider"></div>

            <div class="info-row">
                <span class="info-label">Bàn:</span>
                <span class="info-value uppercase">${tableName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Thời gian:</span>
                <span class="info-value">${dateStr}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Hình thức:</span>
                <span class="info-value">${getPaymentMethodLabel(paymentMethod)}</span>
            </div>

            <div class="divider"></div>

            <table class="item-table">
                <thead>
                    <tr>
                        <th width="50%">Tên món</th>
                        <th width="15%" class="text-center">SL</th>
                        <th width="35%" class="text-right">T.Tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>
                                <div>${item.name}</div>
                                <div style="font-size: 10px; color: #555;">${item.price.toLocaleString()}đ</div>
                            </td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-right bold">${(item.price * item.quantity).toLocaleString()}đ</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="divider"></div>

            <div class="summary-section">
                <div class="info-row">
                    <span class="info-label">Cộng tiền món:</span>
                    <span class="info-value">${subTotal.toLocaleString()}đ</span>
                </div>
                ${totalDiscount > 0 ? `
                    <div class="info-row" style="color: #000;">
                        <span class="info-label">Giảm giá:</span>
                        <span class="info-value">-${totalDiscount.toLocaleString()}đ</span>
                    </div>
                ` : ''}
                <div class="double-divider"></div>
                <div class="total-row">
                    <span>TỔNG CỘNG:</span>
                    <span>${finalTotal.toLocaleString()}đ</span>
                </div>
            </div>

            <div class="double-divider"></div>

            <div class="center footer">
                <div class="bold">CẢM ƠN QUÝ KHÁCH & HẸN GẶP LẠI!</div>
                <div style="margin-top: 5px; font-style: italic;">Powered by DATN Thắng System</div>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;

    // Tạo một Iframe ẩn để in hóa đơn mà không ảnh hưởng tới UX của người dùng
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
    }

    // Tự động xóa iframe sau khi in xong
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 3000);
};
