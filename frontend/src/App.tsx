import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { Exam, AnswerState, StudentProfile } from "./types"
import { API_BASE_URL, authFetch, clearAuthToken } from "./api"

// Icon helper placeholder
function Icon({ name }: { name: string }) {
  return <span>•</span>
}

function PageHead({ admin, student, title }: any) {
  return null
}

export default function App() {
  return null
}
