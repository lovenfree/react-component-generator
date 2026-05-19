import { LiveProvider, LivePreview as ReactLivePreview, LiveError } from 'react-live';
import type { DeviceSize } from './ComponentCard';

interface LivePreviewProps {
  code: string;
  deviceSize?: DeviceSize;
}

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%',
};

const DEVICE_LABELS: Record<DeviceSize, string> = {
  mobile: '모바일 (375px)',
  tablet: '태블릿 (768px)',
  desktop: 'PC',
};

export function LivePreview({ code, deviceSize = 'desktop' }: LivePreviewProps) {
  const maxWidth = DEVICE_WIDTHS[deviceSize];
  const isConstrained = deviceSize !== 'desktop';

  return (
    <div className="preview-panel">
      <div className="panel-header">
        <h3>미리보기</h3>
        <span className="preview-device-label">{DEVICE_LABELS[deviceSize]}</span>
      </div>
      <div className="preview-content">
        <LiveProvider code={code} noInline>
          <div className={`preview-viewport ${isConstrained ? 'preview-viewport--constrained' : ''}`}>
            <div
              className="preview-device-frame"
              style={{ maxWidth, width: isConstrained ? maxWidth : '100%' }}
            >
              {isConstrained && (
                <div className="device-frame-bar">
                  <span className="device-frame-notch" />
                </div>
              )}
              <div className="preview-render">
                <ReactLivePreview />
              </div>
            </div>
          </div>
          <LiveError className="preview-error" />
        </LiveProvider>
      </div>
    </div>
  );
}
