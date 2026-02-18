"use client";

import React from 'react';

export default function FirebaseError() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4" dir="rtl">
            <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8 border border-red-500/30">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-red-400">
                        إعدادات الاتصال مفقودة
                    </h1>

                    <p className="text-gray-300 text-lg leading-relaxed">
                        لم يتم العثور على إعدادات Firebase اللازمة لتشغيل التطبيق.
                    </p>

                    <div className="bg-black/30 w-full p-6 rounded-lg text-right">
                        <p className="text-sm text-gray-400 mb-2 font-semibold">الإجراء المطلوب من المطور:</p>
                        <p className="text-gray-300 text-sm mb-4">
                            يرجى إضافة المتغيرات البيئية التالية في إعدادات المشروع على Vercel:
                        </p>
                        <ul className="text-left font-mono text-xs text-green-400 space-y-1 bg-black/50 p-4 rounded border border-gray-700 overflow-x-auto" dir="ltr">
                            <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
                            <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
                            <li>NEXT_PUBLIC_FIREBASE_DATABASE_URL</li>
                            <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
                            <li>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
                            <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
                            <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 transition-colors rounded-md text-white font-medium"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            </div>
        </div>
    );
}
