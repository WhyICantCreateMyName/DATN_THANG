import crypto from 'crypto';
import qs from 'qs';

const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || '';
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || '';
const VNPAY_URL = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNPAY_RETURN_URL = process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment-result';

export function sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
        const value = obj[key];
        if (value !== null && value !== undefined && value !== '') {
            const encodedKey = encodeURIComponent(key);
            const encodedValue = encodeURIComponent(String(value)).replace(/%20/g, '+');
            sorted[encodedKey] = encodedValue;
        }
    }
    return sorted;
}

export function createVNPayUrl(txnRef: string, amount: number, orderInfo: string, ipAddr: string): string {
    const date = new Date();
    // Sử dụng cách tạo ngày giống dự án đang chạy (ISO String)
    const createDate = date.toISOString().replace(/[-:T.]/g, '').slice(0, 14);

    let vnpParams: any = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: VNPAY_TMN_CODE,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Amount: Math.round(amount * 100),
        vnp_ReturnUrl: VNPAY_RETURN_URL,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
    };

    vnpParams = sortObject(vnpParams);
    const signData = qs.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnpParams['vnp_SecureHash'] = signed;
    const paymentUrl = VNPAY_URL + '?' + qs.stringify(vnpParams, { encode: false });

    console.log('--- VNPAY DEBUG (GIỐNG DỰ ÁN MẪU) ---');
    console.log('SignData:', signData);
    console.log('Final URL:', paymentUrl);

    return paymentUrl;
}

export function verifyVNPayReturn(vnpParams: any): boolean {
    const secureHash = vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const sortedParams = sortObject(vnpParams);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', VNPAY_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
}
