import React from 'react'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string
  size?: number
  className?: string
}

const Icon = ({ name, size = 20, className = '', ...props }: IconProps) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', className }

  switch (name) {
    case 'smart_toy':
      return (
        <svg {...common} {...props}>
          <rect x="4" y="7" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <rect x="8" y="3" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <circle cx="9" cy="12" r="1" fill="currentColor" />
          <circle cx="15" cy="12" r="1" fill="currentColor" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common} {...props}>
          <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm8.5 16.5L16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'menu_open':
    case 'menu':
      return (
        <svg {...common} {...props}>
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'notifications':
    case 'notification':
      return (
        <svg {...common} {...props}>
          <path d="M15 17H9a3 3 0 0 1-3-3V11a6 6 0 1 1 12 0v3a3 3 0 0 1-3 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...common} {...props}>
          <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'dashboard':
      return (
        <svg {...common} {...props}>
          <rect x="3" y="3" width="8" height="8" stroke="currentColor" strokeWidth="1.5" rx="1" />
          <rect x="13" y="3" width="8" height="4" stroke="currentColor" strokeWidth="1.5" rx="1" />
          <rect x="13" y="9" width="8" height="11" stroke="currentColor" strokeWidth="1.5" rx="1" />
          <rect x="3" y="13" width="8" height="5" stroke="currentColor" strokeWidth="1.5" rx="1" />
        </svg>
      )
    case 'analytics':
    case 'trending_up':
      return (
        <svg {...common} {...props}>
          <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 7l-5 5-3-3-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'check_circle':
      return (
        <svg {...common} {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'record_voice_over':
    case 'mic':
      return (
        <svg {...common} {...props}>
          <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'memory':
      return (
        <svg {...common} {...props}>
          <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 3v3M15 3v3M9 18v3M15 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'download':
      return (
        <svg {...common} {...props}>
          <path d="M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 21H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )
    case 'add':
      return (
        <svg {...common} {...props}>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'person':
    case 'person_add':
      return (
        <svg {...common} {...props}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    case 'lightbulb':
      return (
        <svg {...common} {...props}>
          <path d="M9 18h6M10 10a2 2 0 1 1 4 0c0 2-2 3-2 3s-2-1-2-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 13a7 7 0 1 1 10 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'description':
      return (
        <svg {...common} {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'settings':
      return (
        <svg {...common} {...props}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 0 1 4.27 18.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 0 1 5.73 4.27l.06.06c.5.5 1.18.68 1.82.33.57-.3 1.2-.3 1.7 0l.06.03A1.65 1.65 0 0 0 11 6.1V6a2 2 0 0 1 4 0v.1c.5.18 1.07.04 1.46-.27l.06-.04c.5-.3 1.13-.3 1.7 0 .64.35 1.32.17 1.82-.33l.06-.06A2 2 0 0 1 19.73 5.27l-.06.06c-.5.5-.68 1.18-.33 1.82.3.57.3 1.2 0 1.7l-.03.06c-.18.5-.04 1.07.27 1.46.31.5.31 1.13 0 1.7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'more_vert':
      return (
        <svg {...common} {...props}>
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        </svg>
      )
    case 'visibility':
      return (
        <svg {...common} {...props}>
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    case 'visibility_off':
      return (
        <svg {...common} {...props}>
          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a17.73 17.73 0 0 1 5.5-6.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'thumb_up':
      return (
        <svg {...common} {...props}>
          <path d="M14 9V5a3 3 0 0 0-6 0v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 22h10l2-7V11a2 2 0 0 0-2-2h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'thumb_down':
      return (
        <svg {...common} {...props}>
          <path d="M10 15v4a3 3 0 0 0 6 0v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 2H7l-2 7v4a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'error':
      return (
        <svg {...common} {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'warning':
      return (
        <svg {...common} {...props}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common} {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M11 10h2M11 14h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'filter_list':
      return (
        <svg {...common} {...props}>
          <path d="M3 6h18M6 12h12M10 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...common} {...props}>
          <path d="M3 21l3-1 11-11 1-3-3 1-11 11-1 3z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 7l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'print':
      return (
        <svg {...common} {...props}>
          <rect x="6" y="3" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M6 9v6h12V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 15v6h6v-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'send':
      return (
        <svg {...common} {...props}>
          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'play_arrow':
      return (
        <svg {...common} {...props}>
          <path d="M5 3v18l15-9L5 3z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'stop_circle':
      return (
        <svg {...common} {...props}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="9" y="9" width="6" height="6" fill="currentColor" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...common} {...props}>
          <path d="M21 12a9 9 0 1 0-3 6.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M21 12v-4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'navigate_next':
      return (
        <svg {...common} {...props}>
          <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    default:
      // Generic square placeholder (keeps layout intact)
      return (
        <svg {...common} {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      )
  }
}

export default Icon
