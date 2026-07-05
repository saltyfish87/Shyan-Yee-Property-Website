import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { Youtube, MessageCircle, Mail, Award, CheckCircle2, Star } from 'lucide-react';

export const AgentCard: React.FC = () => {
  const { t, language } = useLanguage();
  const [subscribed, setSubscribed] = useState(false);

  return (
    <section id="agent-profile" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden shadow-xl p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Agent image block */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative group">
                {/* Decorative glowing gradient backdrop */}
                <div className="absolute -inset-1.5 ig-gradient rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
                
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-[4/5] w-72 sm:w-80 shadow-2xl">
                  {/* Real advisor/avatar representation */}
                  <img
                    src="https://lh3.googleusercontent.com/d/1jrGU7WOGJOTL_ORhhYMpjZ7IgMoNavKY=w1000"
                    alt="Shyan Yee - MALAYSIA Real Estate Consultant"
                    className="w-full h-full object-cover object-top filter contrast-[1.02] bg-slate-950"
                  />
                  {/* Status Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-100 shadow-lg">
                    <span className="block text-xs font-black uppercase text-slate-900 tracking-widest mb-0.5">
                      Shyan Yee
                    </span>
                    <span className="block text-[10px] text-orange-600 font-extrabold uppercase tracking-wider">
                      REN 46305 • RE/MAX Malaysia Partner
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Trust badges */}
              <div className="flex gap-4 mt-8 flex-wrap justify-center">
                <div className="flex items-center gap-1 bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm text-[11px] font-bold text-slate-600">
                  <Star className="h-4.5 w-4.5 text-yellow-400 fill-yellow-400" />
                  <span>{t('brokerRating')}</span>
                </div>
                <div className="flex items-center gap-1 bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm text-[11px] font-bold text-slate-600">
                  <Award className="h-4.5 w-4.5 text-orange-500" />
                  <span>{t('mieaMember')}</span>
                </div>
              </div>
            </div>

            {/* Agent Content and Social media block */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100 text-xs font-black tracking-widest uppercase">
                {t('portalRepresentative')}
              </span>
              
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
                Shyan Yee <span className="block sm:inline text-slate-400 font-light text-2xl sm:text-3xl sm:ml-2">{t('trustedAdvisor')}</span>
              </h2>

              <p className="text-slate-600 text-lg leading-relaxed font-medium">
                {t('agentIntro')}
              </p>

              {/* Achievements points checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {[
                  t('agentPt1'),
                  t('agentPt2'),
                  t('agentPt3'),
                  t('agentPt4')
                ].map((pt, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>

              {/* YouTube Box & CTA */}
              <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-center justify-between">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="p-3 bg-red-50 rounded-xl text-red-600">
                    <Youtube className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      @shyanyee-8932 Property Channel
                    </h4>
                    <p className="text-xs text-slate-500">
                      {t('youtubeDesc')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="https://www.youtube.com/@shyanyee-8932"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap"
                  >
                    {t('watchYoutube')}
                  </a>
                  <button
                    onClick={() => setSubscribed(!subscribed)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                      subscribed 
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50' 
                        : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {subscribed ? t('subscribed') : t('subscribe')}
                  </button>
                </div>
              </div>

              {/* Call-to-actions buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <a
                  href={`https://wa.me/60195598932?text=${encodeURIComponent(
                    language.startsWith('zh')
                      ? "您好 Shyan Yee，我在房产顾问板块关注了您的介绍，希望能进一步向您咨询马来西亚的各类精品楼盘和专享置业方案。谢谢！"
                      : language === 'ja'
                      ? "こんにちは Shyan Yee、エージェントプロフィールを拝見しました。マレーシアの厳選された不動産物件や購入スキームについて相談したいです。"
                      : "Hi Shyan Yee, I found your real estate advisor profile and would appreciate consulting with you on premium property investments and buying options in Malaysia. Thank you!"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 ig-gradient text-white font-extrabold rounded-full shadow-lg shadow-orange-500/10 hover:opacity-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer text-[14px]"
                >
                  <MessageCircle className="h-5 w-5 fill-white" />
                  <span>{t('whatsAppCTA')}</span>
                </a>
                <a
                  href="mailto:shyanyeews@gmail.com"
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold rounded-full transition-all text-center flex items-center justify-center gap-2 cursor-pointer text-[14px]"
                >
                  <Mail className="h-5 w-5 text-slate-500" />
                  <span>shyanyeews@gmail.com</span>
                </a>
              </div>

              {/* Instant Scan Connect QR codes */}
              <div className="pt-6 border-t border-slate-200">
                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  {language.startsWith('zh') ? "直接扫码加我咨询 / 关注" : language === 'ja' ? "QRコードで直接問い合わせ・フォロー" : "Direct Scan to Consult / Connect"}
                </h4>
                <div className="grid grid-cols-3 gap-3 max-w-lg">
                  {[
                    {
                      id: "wechat",
                      title: language.startsWith('zh') ? "微信 (WeChat)" : "WeChat",
                      url: "https://lh3.googleusercontent.com/d/1X2pfmUcTjnLJfnoeEeKWXrIzdW3ZTViF=w400",
                      desc: "ID: ShyanYee"
                    },
                    {
                      id: "line",
                      title: "Line",
                      url: "https://lh3.googleusercontent.com/d/1Hcd45E_dAtvZNDVOs4dJyeAnmMZdkmTC=w400",
                      desc: "Line Business"
                    },
                    {
                      id: "klcc",
                      title: language.startsWith('zh') ? "吉隆坡房产" : "KLCC Properties",
                      url: "https://lh3.googleusercontent.com/d/1NaN5fDlEdu52DhyZ8qr6BoCnp1Gd3EJQ=w400",
                      desc: "Scan Article"
                    }
                  ].map((qr, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-2xl border border-slate-200 flex flex-col items-center text-center shadow-xs hover:border-orange-200 hover:shadow-md transition-all group">
                      <div className="aspect-square w-full sm:w-24 bg-white rounded-xl overflow-hidden border border-slate-100 mb-2 p-1.5 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <img
                          src={qr.url}
                          alt={qr.title}
                          className="w-full h-full object-contain select-none"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="block text-[11px] font-black text-slate-900 leading-tight">
                        {qr.title}
                      </span>
                      <span className="block text-[9px] text-slate-400 mt-0.5 font-medium whitespace-nowrap">
                        {qr.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
