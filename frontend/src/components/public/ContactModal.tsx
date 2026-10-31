import { FormEvent, useState } from "react"

interface ContactModalProps {
  open: boolean
  onClose: () => void
  track?: string
}

export function ContactModal({ open, onClose, track }: ContactModalProps) {
  const [submitted, setSubmitted] = useState(false)

  if (!open) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={onClose} aria-label="Close contact form" className="absolute right-4 top-4 rounded-full p-2 text-2xl leading-none text-slate-500 hover:bg-slate-100">×</button>
        {submitted ? (
          <div className="py-8 text-center">
            <span className="material-symbols-outlined text-5xl text-blue-600">check_circle</span>
            <h2 className="mt-4 text-2xl font-black text-slate-950">Thanks for reaching out!</h2>
            <p className="mt-2 text-slate-600">Our team will contact you shortly.</p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">Close</button>
          </div>
        ) : (
          <>
            <span className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-600">Get in touch</span>
            <h2 id="contact-modal-title" className="mt-2 text-3xl font-black text-slate-950">Contact Us</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Tell us how we can help{track ? ` with ${track}` : ""}.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input required name="name" placeholder="Your name" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
              <input required type="email" name="email" placeholder="Email address" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
              <input name="phone" placeholder="Phone number" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
              <textarea required name="message" rows={4} placeholder="How can we help?" className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" defaultValue={track ? `I am interested in ${track}.` : ""} />
              <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-bold text-white shadow-md">Send enquiry</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
