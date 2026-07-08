import './ModeSelector.css'

export type Mode = 'side-by-side' | 'split' | 'single-A' | 'single-B'

interface ModeSelectorProps {
    mode: Mode
    onChange: (mode: Mode) => void
}

function ModeSelector({ mode, onChange }: ModeSelectorProps) {
    return (
        <div className="mode-selector">
            <button
                className={`mode-tile ${mode === 'side-by-side' ? 'active' : ''}`}
                onClick={() => onChange('side-by-side')}
            >
                <span className="mode-icon">⧉</span>
                <span className="mode-label">Две карты</span>
            </button>

            <button
                className={`mode-tile ${mode === 'split' ? 'active' : ''}`}
                onClick={() => onChange('split')}
            >
                <span className="mode-icon">◧</span>
                <span className="mode-label">Разделённая</span>
            </button>

            <div className="mode-tile-split">
                <button
                    className={`mode-tile-half left ${mode === 'single-A' ? 'active' : ''}`}
                    onClick={() => onChange('single-A')}
                >
                    <span className="mode-icon">◧</span>
                    <span className="mode-label">Левая</span>
                </button>
                <button
                    className={`mode-tile-half right ${mode === 'single-B' ? 'active' : ''}`}
                    onClick={() => onChange('single-B')}
                >
                    <span className="mode-icon">◨</span>
                    <span className="mode-label">Правая</span>
                </button>
            </div>
        </div>
    )
}

export default ModeSelector
