import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  SwitchForTimeCardConfig,
  HomeAssistant,
  LovelaceCardEditor,
} from './types';
import { SUPPORTED_DOMAINS } from './types';

@customElement('switch-for-time-card-editor')
export class SwitchForTimeCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: SwitchForTimeCardConfig;

  public setConfig(config: SwitchForTimeCardConfig): void {
    this._config = config;
  }

  private _valueChanged(ev: CustomEvent): void {
    if (!this._config || !this.hass) return;

    const target = ev.target as any;
    const configValue = target.configValue;
    const value = ev.detail?.value ?? target.value;

    if (configValue) {
      const newConfig = { ...this._config };

      if (configValue === 'durations') {
        // Parse durations from comma-separated string
        newConfig.durations = value
          .split(',')
          .map((d: string) => parseInt(d.trim()))
          .filter((d: number) => !isNaN(d));
      } else if (configValue.includes('.')) {
        // Handle nested properties like theme.popup_title
        const keys = configValue.split('.');
        let obj: any = newConfig;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
      } else {
        (newConfig as any)[configValue] = value;
      }

      this._config = newConfig;
      this._fireEvent('config-changed', { config: this._config });
    }
  }

  private _fireEvent(type: string, detail: any): void {
    const event = new CustomEvent(type, {
      detail,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  protected render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    const durationsString = this._config.durations?.join(', ') || '';

    return html`
      <div class="card-config">
        <div class="option">
          <label>
            Entity (required)
            <input
              type="text"
              .value=${this._config.entity || ''}
              .configValue=${'entity'}
              @input=${this._valueChanged}
              placeholder="switch.living_room_lamp"
            />
          </label>
          <div class="hint">
            Must be a switch, light, input_boolean, fan, siren, humidifier, or media_player
          </div>
        </div>

        <div class="option">
          <label>
            Action
            <select .value=${this._config.action || 'toggle'} .configValue=${'action'} @change=${this._valueChanged}>
              <option value="on">On</option>
              <option value="off">Off</option>
              <option value="toggle">Toggle</option>
            </select>
          </label>
        </div>

        <div class="option">
          <label>
            Revert to
            <select
              .value=${this._config.revert_to || 'previous'}
              .configValue=${'revert_to'}
              @change=${this._valueChanged}
            >
              <option value="previous">Previous state</option>
              <option value="on">On</option>
              <option value="off">Off</option>
              <option value="none">None (leave as-is)</option>
            </select>
          </label>
        </div>

        <div class="option">
          <label>
            Durations (minutes, required)
            <input
              type="text"
              .value=${durationsString}
              .configValue=${'durations'}
              @input=${this._valueChanged}
              placeholder="10, 20, 30, 40"
            />
          </label>
          <div class="hint">Comma-separated list of minutes (1-8 durations)</div>
        </div>

        <div class="option">
          <label>
            Name (optional)
            <input
              type="text"
              .value=${this._config.name || ''}
              .configValue=${'name'}
              @input=${this._valueChanged}
              placeholder="Override entity name"
            />
          </label>
        </div>

        <div class="option">
          <label>
            Icon (optional)
            <input
              type="text"
              .value=${this._config.icon || ''}
              .configValue=${'icon'}
              @input=${this._valueChanged}
              placeholder="mdi:lamp"
            />
          </label>
        </div>

        <div class="option checkbox">
          <label>
            <input
              type="checkbox"
              .checked=${this._config.show_remaining ?? true}
              .configValue=${'show_remaining'}
              @change=${(e: Event) => {
                const target = e.target as HTMLInputElement;
                this._valueChanged(
                  new CustomEvent('change', {
                    detail: { value: target.checked },
                  })
                );
              }}
            />
            Show remaining time
          </label>
        </div>

        <div class="option checkbox">
          <label>
            <input
              type="checkbox"
              .checked=${this._config.allow_custom_duration || false}
              .configValue=${'allow_custom_duration'}
              @change=${(e: Event) => {
                const target = e.target as HTMLInputElement;
                this._valueChanged(
                  new CustomEvent('change', {
                    detail: { value: target.checked },
                  })
                );
              }}
            />
            Allow custom duration
          </label>
        </div>

        <div class="option checkbox">
          <label>
            <input
              type="checkbox"
              .checked=${this._config.confirm_cancel || false}
              .configValue=${'confirm_cancel'}
              @change=${(e: Event) => {
                const target = e.target as HTMLInputElement;
                this._valueChanged(
                  new CustomEvent('change', {
                    detail: { value: target.checked },
                  })
                );
              }}
            />
            Confirm before cancel
          </label>
        </div>

        <div class="option">
          <label>
            Tap behavior
            <select
              .value=${this._config.tap_behavior || 'popup'}
              .configValue=${'tap_behavior'}
              @change=${this._valueChanged}
            >
              <option value="popup">Show popup</option>
              <option value="immediate">Immediate (use first duration)</option>
            </select>
          </label>
        </div>

        <div class="option">
          <label>
            Long press action
            <select
              .value=${this._config.long_press_action || 'cancel'}
              .configValue=${'long_press_action'}
              @change=${this._valueChanged}
            >
              <option value="none">None</option>
              <option value="cancel">Cancel timer</option>
            </select>
          </label>
        </div>

        <div class="section-header">Theme</div>

        <div class="option">
          <label>
            Popup title template
            <input
              type="text"
              .value=${this._config.theme?.popup_title || ''}
              .configValue=${'theme.popup_title'}
              @input=${this._valueChanged}
              placeholder="Turn {action} for…"
            />
          </label>
          <div class="hint">Placeholders: {action}, {entity}, {name}</div>
        </div>

        <div class="option">
          <label>
            Button format template
            <input
              type="text"
              .value=${this._config.theme?.button_format || ''}
              .configValue=${'theme.button_format'}
              @input=${this._valueChanged}
              placeholder="{minutes} min"
            />
          </label>
          <div class="hint">Placeholder: {minutes}</div>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .card-config {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }

      .option {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .option.checkbox {
        flex-direction: row;
        align-items: center;
      }

      .option.checkbox label {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      label {
        font-size: 14px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      input[type='text'],
      input[type='number'],
      select {
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 14px;
      }

      input[type='checkbox'] {
        width: 20px;
        height: 20px;
      }

      .hint {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-style: italic;
      }

      .section-header {
        font-size: 16px;
        font-weight: bold;
        color: var(--primary-text-color);
        margin-top: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--divider-color);
      }
    `;
  }
}
