"use client"
import React, { useEffect, useRef, useState } from 'react'

type Props = {
  // timeout in minutes
  timeoutMinutes?: number
  // how many minutes before logout to show the warning
  warningMinutes?: number
}

export default function SessionTimeout({ timeoutMinutes = 20, warningMinutes = 1 }: Props){
  const logoutTimerRef = useRef<number | null>(null)
  const warnTimerRef = useRef<number | null>(null)
  const countdownIntervalRef = useRef<number | null>(null)
  const expiryRef = useRef<number>(0)

  const [showWarning, setShowWarning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)

  // allow fractional minute values (e.g. 0.5 = 30s) and any positive number
  const timeoutMinutesNum = Number(timeoutMinutes) || 20
  const warningMinutesNum = Number(warningMinutes) || 1
  const timeoutMs = Math.max(0.001, timeoutMinutesNum) * 60 * 1000
  let warningMs = Math.max(0, warningMinutesNum) * 60 * 1000
  // don't let the warning window exceed the timeout
  if (warningMs >= timeoutMs) warningMs = Math.max(0, timeoutMs - 1000)

  useEffect(() => {
    let cancelled = false
    function clearTimers(){
      if (logoutTimerRef.current) { window.clearTimeout(logoutTimerRef.current); logoutTimerRef.current = null }
      if (warnTimerRef.current) { window.clearTimeout(warnTimerRef.current); warnTimerRef.current = null }
      if (countdownIntervalRef.current) { window.clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null }
    }

    function isSessionActive(){
      try { return localStorage.getItem('siu_session_active') === '1' } catch(e){ return false }
    }

    async function logoutAndRedirect(){
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch (err) {
        console.error('Auto-logout error', err)
      } finally {
        try { localStorage.removeItem('siu_session_active') } catch(e) {}
        window.location.href = '/'
      }
    }

    function updateRemaining(){
      const rem = Math.max(0, Math.ceil((expiryRef.current - Date.now()) / 1000))
      setRemainingSeconds(rem)
      if (rem <= 0) {
        // make sure modal hides if time passed
        setShowWarning(false)
      }
    }

    function startTimers(){
      clearTimers()
      expiryRef.current = Date.now() + timeoutMs

      // set warn timer (may be immediate if warningMs >= timeoutMs)
      const whenToWarn = Math.max(0, timeoutMs - warningMs)
      warnTimerRef.current = window.setTimeout(() => {
        setShowWarning(true)
        updateRemaining()
        // start countdown updates every second
        countdownIntervalRef.current = window.setInterval(updateRemaining, 1000) as unknown as number
      }, whenToWarn) as unknown as number

      // set logout timer
      logoutTimerRef.current = window.setTimeout(() => {
        logoutAndRedirect()
      }, timeoutMs) as unknown as number

      // update remaining immediately
      updateRemaining()
    }

    function handleActivity(){
      // if warning is showing, hide it and restart
      setShowWarning(false)
      startTimers()
    }

    const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keydown', 'touchstart']

    // Initialization: check server-side session and only then attach timers/listeners
    ;(async () => {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()
        if (cancelled) return
        if (!data?.session) {
          // no server session: clear local flag to avoid modal showing
          try { localStorage.removeItem('siu_session_active') } catch(e){}
          return
        }

        // server reports session exists => start timers in this tab
        events.forEach((ev) => window.addEventListener(ev, handleActivity))
        startTimers()
      } catch (e) {
        // on error, don't start timers and clear local flag
        try { localStorage.removeItem('siu_session_active') } catch(e){}
        return
      }
    })()

    // listen to storage changes (logout in other tab) to stop timers
    function onStorage(e: StorageEvent){
      if (e.key === 'siu_session_active' && e.newValue !== '1'){
        // session was cleared elsewhere -> stop timers and hide warning
        setShowWarning(false)
        clearTimers()
        events.forEach((ev) => window.removeEventListener(ev, handleActivity))
      }
    }
    window.addEventListener('storage', onStorage)

    // same-tab custom events because storage events don't fire on the same tab
    function onSessionSet(){
      // start timers/listeners if not already
      try {
        events.forEach((ev) => window.addEventListener(ev, handleActivity))
      } catch(e){}
      startTimers()
    }
    function onSessionCleared(){
      setShowWarning(false)
      clearTimers()
      events.forEach((ev) => window.removeEventListener(ev, handleActivity))
    }
  window.addEventListener('siu_session_active_set', onSessionSet)
  window.addEventListener('siu_session_active_cleared', onSessionCleared)

    return () => {
      cancelled = true
      events.forEach((ev) => window.removeEventListener(ev, handleActivity))
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('siu_session_active_set', onSessionSet)
      window.removeEventListener('siu_session_active_cleared', onSessionCleared)
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeoutMs, warningMs])

  function extendSession(){
    // hide warning and restart timers
    setShowWarning(false)
    // simulate activity to restart timers
    expiryRef.current = Date.now() + timeoutMs
    setRemainingSeconds(Math.ceil(timeoutMs / 1000))
    // restart timers by dispatching a custom event
    window.dispatchEvent(new Event('mousemove'))
  }

  async function logoutNow(){
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout error', err)
    } finally {
      try { localStorage.removeItem('siu_session_active') } catch(e) {}
      window.location.href = '/'
    }
  }

  // render a simple modal when about to logout
  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowWarning(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sesión por expirar</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Tu sesión se cerrará automáticamente en {Math.max(0, remainingSeconds)} segundos por inactividad.</p>
            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={logoutNow} className="px-3 py-2 rounded bg-red-50 text-red-700 hover:bg-red-100">Cerrar ahora</button>
              <button onClick={extendSession} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Mantener sesión</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
