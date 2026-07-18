import { PRESETS } from './overrides';
import { useThemeStore } from './themeStore';

/** A 6-digit hex is required by `<input type="color">`; fall back safely. */
const forColorInput = (value: string): string => {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
};

/**
 * Theme lens navigator (PRD F2.1): preset picker + editable core color
 * scales. Editing any step re-derives the theme and re-themes the stage (and
 * the chrome, when "apply to Studio" is on) within the same frame.
 */
export const ThemeNavigator = () => {
  const store = useThemeStore();

  return (
    <div className="theme-navigator">
      <section className="theme-section">
        <h2 className="theme-section-title">Preset</h2>
        <div className="theme-presets">
          {PRESETS.map((preset) => {
            const active = store.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className="theme-preset"
                aria-pressed={active}
                onClick={() => {
                  return store.setPreset(preset.id);
                }}
                title={preset.description}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="theme-section">
        <h2 className="theme-section-title">Colors</h2>
        <p className="theme-hint">
          Edit a core color scale and watch the stage re-theme. The brand scale
          drives accents, links, focus rings, and selected states.
        </p>
        {store.palette.map((scale) => {
          return (
            <fieldset key={scale.hue} className="theme-scale">
              <legend className="theme-scale-legend">{scale.hue}</legend>
              {scale.steps.map(({ step, base }) => {
                const overridden = store.colors[scale.hue]?.[step];
                const value = overridden ?? base;
                const isOverridden = overridden != null;
                const inputId = `color-${scale.hue}-${step}`;
                return (
                  <div key={step} className="theme-swatch-row">
                    <label className="theme-swatch-label" htmlFor={inputId}>
                      {step}
                    </label>
                    <input
                      id={inputId}
                      type="color"
                      className="theme-swatch-input"
                      aria-label={`${scale.hue} ${step} color`}
                      value={forColorInput(value)}
                      onChange={(event) => {
                        return store.setColor(
                          scale.hue,
                          step,
                          event.target.value
                        );
                      }}
                    />
                    <input
                      type="text"
                      className="theme-swatch-hex"
                      aria-label={`${scale.hue} ${step} hex`}
                      value={value}
                      onChange={(event) => {
                        return store.setColor(
                          scale.hue,
                          step,
                          event.target.value
                        );
                      }}
                    />
                    {isOverridden ? (
                      <button
                        type="button"
                        className="theme-revert"
                        aria-label={`Revert ${scale.hue} ${step}`}
                        onClick={() => {
                          return store.revertColor(scale.hue, step);
                        }}
                      >
                        Revert
                      </button>
                    ) : (
                      <span className="theme-revert-placeholder" aria-hidden />
                    )}
                  </div>
                );
              })}
            </fieldset>
          );
        })}
      </section>
    </div>
  );
};
