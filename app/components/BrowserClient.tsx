'use client'

import { useEffect, useState } from 'react'

export default function BrowserClient() {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // If dismissed before, do not show again
    if (sessionStorage.getItem('chromeModalDismissed') === 'true') return

    const ua = navigator.userAgent
    const isIOS = /iPhone|iPad|iPod/i.test(ua)
    const isAndroid = /Android/i.test(ua)
    const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor)
    const isEdge = /Edg/.test(ua)
    const isOpera = /OPR/.test(ua)

    const isRealChrome = isChrome && !isEdge && !isOpera

    if (!isAndroid && !isRealChrome) {
      setShowModal(true)
    }
  }, [])

  const handleDismiss = () => {
    sessionStorage.setItem('chromeModalDismissed', 'true')
    setShowModal(false)
  }

  if (!showModal) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '32px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '450px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        textAlign: 'center',
        animation: 'fadeSlideIn 0.25s ease'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#111',
          marginBottom: '12px'
        }}>
          Best viewed in Chrome
        </h2>
        <p style={{
          fontSize: '15px',
          color: '#444',
          lineHeight: 1.5,
          marginBottom: '24px'
        }}>
          You're currently using a non-Chrome browser. You can still continue, but for the smoothest experience, we recommend switching to Google Chrome.
        </p>
        <button
          onClick={handleDismiss}
          style={{
            padding: '10px 24px',
            backgroundColor: '#111',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 500,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#333'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#111'}
        >
          Continue
        </button>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
