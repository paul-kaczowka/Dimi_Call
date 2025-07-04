import React from 'react';
import { ContactStatus } from './types';

export const APP_NAME = "DimiCall Web";

// SVG Icons as React Components
// Using heroicons (https://heroicons.com/) for a modern look

// Define common icon size for ribbon
const RIBBON_ICON_SIZE = "w-4 h-4"; // Slightly smaller for a denser ribbon
const RIBBON_ICON_SIZE_LARGE = "w-5 h-5"; // For main action buttons

export const IconPhone = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

export const IconMail = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

export const IconSms = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
  </svg>
);


export const IconReminder = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

export const IconCalendar = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
    <path d="m9 16 2 2 4-4" />
    <circle cx="18" cy="16" r="3" />
    <path d="m22 22-1.5-1.5" />
  </svg>
);

export const IconQualification = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconLinkedIn = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.75 3H4.25A1.25 1.25 0 003 4.25v15.5A1.25 1.25 0 004.25 21h15.5A1.25 1.25 0 0021 19.75V4.25A1.25 1.25 0 0019.75 3zM8.5 18.25h-3v-9h3v9zM6.75 8.25a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm11.5 10h-3V13.5c0-.75-.025-1.75-.75-1.75s-.875.625-.875 1.625V18.25h-3v-9h2.875v1.375h.05c.375-.75 1.375-1.5 2.875-1.5 3.125 0 3.75 2.062 3.75 4.75v5.625z" />
  </svg>
);

export const IconGoogle = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22.56,12.25C22.56,11.47,22.5,10.72,22.38,10H12V14.5H18.34C18.13,15.93,17.26,17.08,16.09,17.89V20.5H19.8C21.66,18.84,22.56,15.93,22.56,12.25Z" />
    <path d="M12,24C15.24,24,17.97,22.89,19.8,21L16.09,17.89C15.06,18.66,13.68,19.16,12,19.16C8.84,19.16,6.17,17.16,5.16,14.31H1.29V17C3.16,21.04,7.27,24,12,24Z" />
    <path d="M5.16,14.31C4.94,13.66,4.81,12.86,4.81,12C4.81,11.14,4.94,10.34,5.16,9.69V6.81H1.29C0.45,8.53,0,10.19,0,12C0,13.81,0.45,15.47,1.29,17L5.16,14.31Z" />
    <path d="M12,4.84C13.84,4.84,15.4,5.49,16.63,6.67L20,3.32C17.97,1.26,15.24,0,12,0C7.27,0,3.16,2.96,1.29,6.81L5.16,9.69C6.17,6.84,8.84,4.84,12,4.84Z" />
  </svg>
);

export const IconInfinity = ({ className = RIBBON_ICON_SIZE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.215,8.513c1.033-0.69,2.378-1.076,3.785-1.076 c3.314,0,6,2.686,6,6s-2.686,6-6,6c-1.407,0-2.752-0.386-3.785-1.076M13.785,15.487c-1.033,0.69-2.378,1.076-3.785,1.076 c-3.314,0-6-2.686-6-6s2.686-6,6-6c1.407,0,2.752,0.386,3.785,1.076" />
  </svg>
);


export const IconImport = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338 0 4.5 4.5 0 01-1.41 8.775H6.75z" />
  </svg>
);

export const IconExport = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.25V10.5M12 10.5L15 12.75M12 10.5L9 12.75M6.75 20.25a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338 0 4.5 4.5 0 01-1.41 8.775H6.75z" />
  </svg>
);

export const IconKeyboard = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v17.792M6 3.104h12M6 20.896h12M12.75 3.104V12M12.75 12L15 9.75M12.75 12L10.5 9.75M12.75 20.896V12" />
  </svg>
);

export const IconSupabase = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256" className={className}>
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm65.71,74.29a8,8,0,0,1,0,11.31l-40,40a8,8,0,0,1-11.31,0l-16-16a8,8,0,0,1,11.31-11.31L128,132.69l34.34-34.35a8,8,0,0,1,11.31-11.31ZM80,104a24,24,0,1,1,24,24A24,24,0,0,1,80,104Z"></path>
    </svg>
);

export const IconRefresh = ({ className = RIBBON_ICON_SIZE_LARGE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export const IconSun = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12h2.25m.386-6.364l1.591 1.591M12 12a2.25 2.25 0 00-2.25 2.25V15a2.25 2.25 0 004.5 0V14.25A2.25 2.25 0 0012 12z" />
  </svg>
);

export const IconMoon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

// Table Header Icons (typically smaller)
const TABLE_HEADER_ICON_SIZE = "w-3.5 h-3.5";

export const IconUser = ({ className = TABLE_HEADER_ICON_SIZE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

export const IconComment = ({ className = TABLE_HEADER_ICON_SIZE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const IconClock = ({ className = TABLE_HEADER_ICON_SIZE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconDuration = ({ className = TABLE_HEADER_ICON_SIZE }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m-4.5 0a9 9 0 11-18 0 9 9 0 0118 0zM6.75 9l-1.5 1.5M17.25 9l1.5 1.5" />
    </svg>
);


export const IconStatus = ({ className = TABLE_HEADER_ICON_SIZE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
  </svg>
);

export const IconZap = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

export const IconChevronDown = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const IconChevronUp = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

export const IconCheck = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export const IconX = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const IconFolder = ({ className = TABLE_HEADER_ICON_SIZE }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

export const IconDocument = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export const IconFilePdf = ({ className = "w-5 h-5 text-red-500" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
  </svg>
); 

export const IconFileDoc = ({ className = "w-5 h-5 text-blue-500" }: { className?: string }) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 11h-2v2h2v-2zm0-4h-2V7h2v2z"/>
  </svg>
);

export const IconFileXls = ({ className = "w-5 h-5 text-green-500" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 13h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V5h2v2z"/>
  </svg>
);

export const IconFileImg = ({ className = "w-5 h-5 text-purple-500" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2l-.01-12zM9 16.5l-2.5-3.01L5 15h14l-4.5-6L12 13l-3-3.99z"/>
  </svg>
);

export const IconFileOther = ({ className = "w-5 h-5 text-gray-500" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
  </svg>
);

export const IconChevronLeft = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

export const IconChevronRight = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);


export const IconArrowDownTray = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export const IconTrash = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.24.032 3.22.094M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconUpload = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

export const IconBattery = ({ className = "w-5 h-5", level = 100, charging = false }: { className?: string, level?: number, charging?: boolean }) => {
  const fillPercentage = Math.max(0, Math.min(100, level)) / 100;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25A2.25 2.25 0 0013.5 3H6.75A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21h6.75A2.25 2.25 0 0015.75 18.75V5.25z" />
      {/* Battery Level Fill */}
      <rect x="5.5" y={18.25 - (12.5 * fillPercentage)} width="9" height={12.5 * fillPercentage} rx="0.5" className="text-current fill-current opacity-60" />
      {charging && (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.375L10.5 12h3L10.5 17.625" className="text-yellow-400 dark:text-oled-yellow" strokeWidth="2"/>
      )}
    </svg>
  );
};

export const IconTableColumns = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

export const IconCheckCircle = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconXCircle = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const IconFilter = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
  </svg>
);
export const IconMenuAlt2 = ({ className = "w-5 h-5" }: { className?: string }) => ( // Hamburger for "More"
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);
export const IconDotsVertical = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
  </svg>
);


// Add "Actions" to COLUMN_HEADERS and a corresponding 'null' or specific key to CONTACT_DATA_KEYS
export const COLUMN_HEADERS = ["#", "Prénom", "Nom", "Téléphone", "Mail", "Ecole", "Statut", "Commentaire", "Date Rappel", "Heure Rappel", "Date RDV", "Heure RDV", "Date Appel", "Heure Appel", "Durée Appel", "Actions"];
export const CONTACT_DATA_KEYS: (keyof import('./types').Contact | 'actions' | null)[] = [
    'numeroLigne', 'prenom', 'nom', 'telephone', 'email', 'ecole', 'statut', 
    'commentaire', 'dateRappel', 'heureRappel', 'dateRDV', 'heureRDV', 
    'dateAppel', 'heureAppel', 'dureeAppel', 'actions' // 'actions' key for the new column
  ];


export const STRETCHABLE_COLUMN_INDICES = [1, 2, 4, 5, 7]; // Prénom, Nom, Mail, École, Commentaire

export const STATUS_OPTIONS: ContactStatus[] = Object.values(ContactStatus);

export const STATUS_COLORS: Record<ContactStatus, { bg: string; text: string; darkBg: string; darkText: string }> = {
  [ContactStatus.NonDefini]: { bg: "bg-gray-200", text: "text-gray-700", darkBg: "dark:bg-neutral-700", darkText: "dark:text-neutral-300" },
  [ContactStatus.MauvaisNum]: { bg: "bg-red-200", text: "text-red-700", darkBg: "dark:bg-red-700", darkText: "dark:text-red-100" },
  [ContactStatus.Repondeur]: { bg: "bg-yellow-200", text: "text-yellow-700", darkBg: "dark:bg-yellow-600", darkText: "dark:text-yellow-100" },
  [ContactStatus.ARappeler]: { bg: "bg-amber-200", text: "text-amber-700", darkBg: "dark:bg-amber-500", darkText: "dark:text-amber-900" },
  [ContactStatus.PasInteresse]: { bg: "bg-slate-200", text: "text-slate-700", darkBg: "dark:bg-slate-600", darkText: "dark:text-slate-100" },
  [ContactStatus.Argumente]: { bg: "bg-blue-200", text: "text-blue-700", darkBg: "dark:bg-blue-600", darkText: "dark:text-blue-100" },
  [ContactStatus.DO]: { bg: "bg-green-200", text: "text-green-700", darkBg: "dark:bg-green-600", darkText: "dark:text-green-100" },
  [ContactStatus.RO]: { bg: "bg-emerald-200", text: "text-emerald-700", darkBg: "dark:bg-emerald-700", darkText: "dark:text-emerald-100" },
  [ContactStatus.ListeNoire]: { bg: "bg-zinc-800", text: "text-zinc-200", darkBg: "dark:bg-black", darkText: "dark:text-gray-400" },
  [ContactStatus.Premature]: { bg: "bg-pink-200", text: "text-pink-700", darkBg: "dark:bg-pink-600", darkText: "dark:text-pink-100" },
};

export const QUICK_COMMENTS = ["Accompagné", "Du métier", "Prospection", "Non exploitable", "Bloqué ?"];

export const headerIcons: Record<string, React.ReactNode> = {
  "#": undefined, 
  "Prénom": <IconUser />,
  "Nom": <IconUser />,
  "Téléphone": <IconPhone className={TABLE_HEADER_ICON_SIZE} />,
  "Mail": <IconMail className={TABLE_HEADER_ICON_SIZE} />,
  "Ecole": <IconFolder />,
  "Statut": <IconStatus />,
  "Commentaire": <IconComment />,
  "Date Rappel": <IconCalendar className={TABLE_HEADER_ICON_SIZE} />,
  "Heure Rappel": <IconClock />,
  "Date RDV": <IconCalendar className={TABLE_HEADER_ICON_SIZE} />,
  "Heure RDV": <IconClock />,
  "Date Appel": <IconCalendar className={TABLE_HEADER_ICON_SIZE} />,
  "Heure Appel": <IconClock />,
  "Durée Appel": <IconDuration />,
  "Actions": <IconDotsVertical className="w-3.5 h-3.5" />
};

export const INITIAL_CONTACTS_COUNT = 0; // Or load from a default set later

// Constantes pour l'application