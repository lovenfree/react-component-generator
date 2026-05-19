import { useState } from 'react';
import type { GeneratedComponent } from '../types';
import { LivePreview } from './LivePreview';
import { CodeView } from './CodeView';

interface ComponentCardProps {
  component: GeneratedComponent;
  onRemove: (id: string) => void;
  onRegenerate: (prompt: string) => void;
  isLoading: boolean;
}

type Tab = 'preview' | 'code';
export type DeviceSize = 'mobile' | 'tablet' | 'desktop';

const DEVICE_TABS: { id: DeviceSize; label: string; icon: string; width: string }[] = [
  { id: 'mobile', label: '모바일', icon: '📱', width: '375px' },
  { id: 'tablet', label: '태블릿', icon: '📟', width: '768px' },
  { id: 'desktop', label: 'PC', icon: '🖥', width: '100%' },
];

export function ComponentCard({ component, onRemove, onRegenerate, isLoading }: ComponentCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const createdAt = component.createdAt.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="component-card">
      <div className="card-header">
        <div className="card-title-group">
          <span>{createdAt}</span>
          <p className="card-prompt">{component.prompt}</p>
        </div>
        <div className="card-actions">
          <button
            className="btn-refresh"
            onClick={() => setPreviewKey((k) => k + 1)}
            title="미리보기 새로고침"
            aria-label="미리보기 새로고침"
          >
            ↻
          </button>
          <button
            className="btn-regenerate"
            onClick={() => onRegenerate(component.prompt)}
            disabled={isLoading}
          >
            {isLoading ? '생성 중...' : '재생성'}
          </button>
          <button
            className="btn-remove"
            onClick={() => onRemove(component.id)}
          >
            삭제
          </button>
        </div>
      </div>
      <div className="card-tabs">
        <button
          className={`tab ${activeTab === 'preview' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          미리보기
        </button>
        <button
          className={`tab ${activeTab === 'code' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          코드
        </button>
      </div>
      {activeTab === 'preview' && (
        <div className="device-tabs">
          {DEVICE_TABS.map((device) => (
            <button
              key={device.id}
              className={`device-tab ${deviceSize === device.id ? 'device-tab--active' : ''}`}
              onClick={() => setDeviceSize(device.id)}
              title={`${device.label} (${device.width})`}
            >
              <span className="device-tab-icon">{device.icon}</span>
              <span className="device-tab-label">{device.label}</span>
              <span className="device-tab-width">{device.width}</span>
            </button>
          ))}
        </div>
      )}
      <div className="card-content">
        {activeTab === 'preview' ? (
          <LivePreview key={previewKey} code={component.code} deviceSize={deviceSize} />
        ) : (
          <CodeView code={component.code} />
        )}
      </div>
    </div>
  );
}
