# ModResolve

ModResolve is an AI-powered web application designed to help Minecraft players and server administrators troubleshoot issues quickly. It provides two main features: analyzing Minecraft error logs to identify root causes and suggest solutions, and a general-purpose conversational AI to answer any Minecraft-related questions.

Built with Next.js and powered by Google's Gemini AI through Genkit, this application offers a clean, modern, and responsive user interface for a seamless experience.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit) (with Google's Gemini models)
-   **UI**: [React](https://react.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Component Library**: [ShadCN/UI](https://ui.shadcn.com/)

## Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

-   [Node.js](https://nodejs.org/en) (v18 or later recommended)
-   [npm](https://www.npmjs.com/) or a compatible package manager
-   A Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/your-repository-name.git
    cd your-repository-name
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a new file named `.env` in the root of your project by copying the example file.
    ```sh
    cp .env.example .env
    ```
    Open the new `.env` file and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) in your browser to see the result.

## Available Scripts

In the project directory, you can run:

-   `npm run dev`: Runs the app in development mode.
-   `npm run build`: Builds the app for production.
-   `npm run start`: Starts a Next.js production server.
-   `npm run lint`: Runs the linter to check for code quality issues.
-   `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
