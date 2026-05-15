import crypto from 'crypto';

const MOMO_CONFIG = {
    partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
    accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
    secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/payment-result',
    ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:4000/payment/momo/ipn',
};

const sign = (rawSignature: string) => {
    return crypto.createHmac('sha256', MOMO_CONFIG.secretKey).update(rawSignature).digest('hex');
};

export const createMomoUrl = async ({ orderId, amount, orderInfo, extraData = '', redirectUrl }: any) => {
    const requestId = orderId;
    const requestType = 'captureWallet';
    
    const payloadForSignature = {
        accessKey: MOMO_CONFIG.accessKey,
        amount: String(amount),
        extraData,
        ipnUrl: MOMO_CONFIG.ipnUrl,
        orderId,
        orderInfo,
        partnerCode: MOMO_CONFIG.partnerCode,
        redirectUrl: redirectUrl || MOMO_CONFIG.redirectUrl,
        requestId,
        requestType,
    };

    const rawSignature = `accessKey=${payloadForSignature.accessKey}&amount=${payloadForSignature.amount}&extraData=${payloadForSignature.extraData}&ipnUrl=${payloadForSignature.ipnUrl}&orderId=${payloadForSignature.orderId}&orderInfo=${payloadForSignature.orderInfo}&partnerCode=${payloadForSignature.partnerCode}&redirectUrl=${payloadForSignature.redirectUrl}&requestId=${payloadForSignature.requestId}&requestType=${payloadForSignature.requestType}`;
    
    const signature = sign(rawSignature);

    const requestBody = {
        ...payloadForSignature,
        signature,
        lang: 'vi',
    };

    const response = await fetch(MOMO_CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    return await response.json();
};

export const verifyMomoSignature = (payload: any) => {
    const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = payload;
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const checkSignature = sign(rawSignature);
    return checkSignature === signature;
};
