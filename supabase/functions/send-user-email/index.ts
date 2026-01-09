import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'welcome' | 'new_device' | 'deposit' | 'withdrawal' | 'promotional';
  user_id?: string;
  email?: string;
  name?: string;
  amount?: number;
  currency?: string;
  device_info?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, user_id, email, name, amount, currency, device_info }: EmailRequest = await req.json();

    let userEmail = email;
    let userName = name;

    // Fetch user details if not provided
    if (user_id && (!userEmail || !userName)) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user_id)
        .single();

      if (profile) {
        userEmail = userEmail || profile.email;
        userName = userName || profile.full_name;
      }
    }

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "Email address required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case 'welcome':
        subject = "Welcome to TAMIC GROUP! 🎉";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a2e; margin: 0;">TAMIC GROUP</h1>
              <p style="color: #666; margin-top: 5px;">Your Investment Partner</p>
            </div>
            <h2 style="color: #1a1a2e;">Welcome, ${userName || 'Investor'}! 👋</h2>
            <p style="color: #444; line-height: 1.6;">
              Thank you for joining TAMIC GROUP. We're excited to have you on board!
            </p>
            <p style="color: #444; line-height: 1.6;">
              With your new account, you can:
            </p>
            <ul style="color: #444; line-height: 1.8;">
              <li>Invest in stocks and cryptocurrencies</li>
              <li>Purchase TAMIC Shares (TAMG)</li>
              <li>Track your portfolio performance</li>
              <li>Make secure deposits and withdrawals</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tamic.lovable.app/dashboard" style="background: #1a1a2e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
              © ${new Date().getFullYear()} TAMIC GROUP. All rights reserved.
            </p>
          </div>
        `;
        break;

      case 'new_device':
        subject = "New Device Sign-In Detected - TAMIC GROUP";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a2e; margin: 0;">TAMIC GROUP</h1>
              <p style="color: #666; margin-top: 5px;">Security Alert</p>
            </div>
            <h2 style="color: #1a1a2e;">New Sign-In Detected 🔐</h2>
            <p style="color: #444; line-height: 1.6;">
              Hello ${userName || 'Investor'},
            </p>
            <p style="color: #444; line-height: 1.6;">
              We detected a new sign-in to your TAMIC GROUP account.
            </p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #444;"><strong>Device:</strong> ${device_info || 'Unknown device'}</p>
              <p style="margin: 10px 0 0; color: #444;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #444; line-height: 1.6;">
              If this was you, no action is needed. If you don't recognize this activity, please change your password immediately.
            </p>
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
              © ${new Date().getFullYear()} TAMIC GROUP. All rights reserved.
            </p>
          </div>
        `;
        break;

      case 'deposit':
        subject = "Deposit Received - TAMIC GROUP";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a2e; margin: 0;">TAMIC GROUP</h1>
              <p style="color: #666; margin-top: 5px;">Transaction Notification</p>
            </div>
            <h2 style="color: #1a1a2e;">Deposit Confirmed ✅</h2>
            <p style="color: #444; line-height: 1.6;">
              Hello ${userName || 'Investor'},
            </p>
            <p style="color: #444; line-height: 1.6;">
              Your deposit has been received and is being processed.
            </p>
            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #2e7d32; font-size: 24px; font-weight: bold;">
                ${amount ? `$${amount.toLocaleString()}` : 'Pending verification'}
              </p>
              <p style="margin: 5px 0 0; color: #666;">${currency || 'Cryptocurrency'} Deposit</p>
            </div>
            <p style="color: #444; line-height: 1.6;">
              Funds will be credited to your account once the transaction is confirmed on the blockchain.
            </p>
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
              © ${new Date().getFullYear()} TAMIC GROUP. All rights reserved.
            </p>
          </div>
        `;
        break;

      case 'withdrawal':
        subject = "Withdrawal Request - TAMIC GROUP";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a2e; margin: 0;">TAMIC GROUP</h1>
              <p style="color: #666; margin-top: 5px;">Transaction Notification</p>
            </div>
            <h2 style="color: #1a1a2e;">Withdrawal Request Submitted 📤</h2>
            <p style="color: #444; line-height: 1.6;">
              Hello ${userName || 'Investor'},
            </p>
            <p style="color: #444; line-height: 1.6;">
              Your withdrawal request has been submitted and is pending approval.
            </p>
            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #e65100; font-size: 24px; font-weight: bold;">
                ${amount ? `$${amount.toLocaleString()}` : 'Amount pending'}
              </p>
              <p style="margin: 5px 0 0; color: #666;">Withdrawal Request</p>
            </div>
            <p style="color: #444; line-height: 1.6;">
              You will be notified once your withdrawal has been processed. This usually takes 1-3 business days.
            </p>
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
              © ${new Date().getFullYear()} TAMIC GROUP. All rights reserved.
            </p>
          </div>
        `;
        break;

      case 'promotional':
        subject = "Grow Your Portfolio with TAMIC Shares! 📈";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a2e; margin: 0;">TAMIC GROUP</h1>
              <p style="color: #666; margin-top: 5px;">Investment Opportunity</p>
            </div>
            <h2 style="color: #1a1a2e;">Don't Miss Out on TAMIC Shares! 🚀</h2>
            <p style="color: #444; line-height: 1.6;">
              Hello ${userName || 'Investor'},
            </p>
            <p style="color: #444; line-height: 1.6;">
              Have you considered adding TAMIC Shares (TAMG) to your portfolio? Here's why investors are choosing TAMG:
            </p>
            <ul style="color: #444; line-height: 1.8;">
              <li>🏢 Backed by TAMIC GROUP's growing portfolio</li>
              <li>📊 Consistent performance tracking</li>
              <li>💰 Competitive pricing</li>
              <li>🔒 Secure and regulated</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://tamic.lovable.app/dashboard" style="background: #1a1a2e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Buy TAMG Now
              </a>
            </div>
            <p style="color: #666; font-size: 12px; text-align: center;">
              Start investing today and watch your portfolio grow!
            </p>
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
              © ${new Date().getFullYear()} TAMIC GROUP. All rights reserved.
            </p>
          </div>
        `;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid email type" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }

    console.log(`Sending ${type} email to ${userEmail}`);

    const { data, error } = await resend.emails.send({
      from: "TAMIC GROUP <noreply@tamicgroup.com>",
      to: [userEmail],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Email send error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-user-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
