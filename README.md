# Zenithra Hardware Interface Quest
A high-performance, single-page dashboard designed to interface with local hardware using modern Web APIs. This project was built as the final stage of the Zenithra Tech engineering challenge, focusing on asynchronous hardware streams, browser permission lifecycles, and professional UI/UX.

## 🛠️ Core Features

### 📷 Camera Interface (WebRTC)
*   **Technology**: `getUserMedia` API.
*   **Functionality**: Real-time video feed rendered in a low-latency `<video>` element.
*   **Handling**: Robust permission management and stream termination logic.

### 🎤 Acoustic Processor (Web Speech API)
*   **Technology**: `webkitSpeechRecognition` / `SpeechRecognition`.
*   **Functionality**: Live voice-to-text transcription with an auto-restart mechanism for continuous listening.
*   **UI**: Terminal-style text output with a blinking cursor.

### 🦷 Bluetooth Link (Web Bluetooth API)
*   **Technology**: `navigator.bluetooth`.
*   **Functionality**: Scans for and identifies nearby Bluetooth devices.
*   **Compatibility**: Optimized for Chrome/Edge on HTTPS environments.

## 🚀 Tech Stack

*   **Frontend**: React 19 (Functional Components & Hooks)
*   **Styling**: Tailwind CSS 4.0
*   **Animations**: Motion (formerly Framer Motion)
*   **Icons**: Lucide React
*   **Build Tool**: Vite

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   NPM or Yarn
*   **HTTPS Environment**: Web Bluetooth and WebRTC require a secure context (HTTPS or localhost) to function.

### Installation

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the development server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## 🏗️ Architecture Notes

*   **Modular Hardware Cards**: Each hardware interface is encapsulated in a reusable `HardwareCard` component, ensuring clean separation of concerns.
*   **Centralized Logging**: A dedicated system log tracks all hardware handshakes, permission states, and errors in real-time.
*   **Permission Lifecycle**: The application gracefully handles `NotAllowedError` and `NotFoundError`, providing clear feedback to the user when hardware access is denied or unavailable.

## ⚖️ License
Distributed under the Apache-2.0 License. See `LICENSE` for more information.

---
**ZENITHRA TECHNOLOGIES // HARDWARE_QUEST_COMPLETED**
