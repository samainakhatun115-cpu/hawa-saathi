import { AssistantApp } from "@/components/assistant-app"

export default function Home() {
  return (
    <>
      <a
        href="#assistant"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        Skip to air assistant
      </a>
      <AssistantApp />
    </>
  )
}
