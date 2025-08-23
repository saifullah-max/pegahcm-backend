"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
// Test SendGrid email
router.post('/test-email', async (req, res) => {
    try {
        const apiKey = process.env.SENDGRID_API_KEY;
        const fromEmail = process.env.SENDGRID_FROM_EMAIL;
        if (!apiKey) {
            throw new Error('SENDGRID_API_KEY is not configured');
        }
        if (!fromEmail) {
            throw new Error('SENDGRID_FROM_EMAIL is not configured');
        }
        console.log('Using API Key:', apiKey.substring(0, 5) + '...');
        console.log('From Email:', fromEmail);
        mail_1.default.setApiKey(apiKey);
        const msg = {
            to: 'waqarkhanmps@gmail.com',
            from: fromEmail,
            subject: 'Sending with SendGrid is Fun',
            text: 'and easy to do anywhere, even with Node.js',
            html: '<strong>and easy to do anywhere, even with Node.js</strong>',
        };
        console.log('Attempting to send email with config:', {
            to: msg.to,
            from: msg.from,
            subject: msg.subject
        });
        const response = await mail_1.default.send(msg);
        console.log('SendGrid Response:', response);
        res.json({
            success: true,
            message: 'Test email sent successfully',
            details: {
                to: msg.to,
                from: msg.from,
                subject: msg.subject
            }
        });
    }
    catch (error) {
        console.error('Error sending test email:', error);
        if (error.response) {
            console.error('SendGrid Error Response:', error.response.body);
        }
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error.response?.body || 'No additional details available'
        });
    }
});
exports.default = router;
