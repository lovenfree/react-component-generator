import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptInput } from './PromptInput';

describe('PromptInput 컴포넌트', () => {
  describe('useState 훅 - prompt 상태 관리', () => {
    it('초기 상태에서 textarea가 비어있어야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('textarea 입력 시 prompt 상태가 업데이트되어야 한다', async () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: '검색 필터 바 만들기' } });

      expect(textarea.value).toBe('검색 필터 바 만들기');
    });

    it('문자 수가 올바르게 표시되어야 한다', async () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: '테스트' } });

      expect(screen.getByText('3자')).toBeTruthy();
    });

    it('문자 수가 500자를 초과하면 빨간색으로 표시되어야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      const longText = 'a'.repeat(501);
      fireEvent.change(textarea, { target: { value: longText } });

      const charCount = screen.getByText('501자');
      expect(charCount.style.color).toBe('rgb(231, 76, 60)');
    });
  });

  describe('handleSubmit 훅 - 폼 제출 처리', () => {
    it('폼 제출 버튼 클릭 시 onGenerate가 호출되어야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      const button = screen.getByRole('button', { name: /컴포넌트 생성/ });

      fireEvent.change(textarea, { target: { value: '컴포넌트 테스트' } });
      fireEvent.click(button);

      expect(mockOnGenerate).toHaveBeenCalledWith('컴포넌트 테스트');
    });

    it('빈 입력값으로는 onGenerate가 호출되지 않아야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const button = screen.getByRole('button', { name: /컴포넌트 생성/ });
      fireEvent.click(button);

      expect(mockOnGenerate).not.toHaveBeenCalled();
    });

    it('공백만 있는 입력값으로는 onGenerate가 호출되지 않아야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      const button = screen.getByRole('button', { name: /컴포넌트 생성/ });

      fireEvent.change(textarea, { target: { value: '   ' } });
      fireEvent.click(button);

      expect(mockOnGenerate).not.toHaveBeenCalled();
    });

    it('isLoading이 true일 때는 onGenerate가 호출되지 않아야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={true} />);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      const button = screen.getByRole('button', { name: /생성 중/ });

      fireEvent.change(textarea, { target: { value: '컴포넌트 테스트' } });
      fireEvent.click(button);

      expect(mockOnGenerate).not.toHaveBeenCalled();
    });

    it('입력값의 앞뒤 공백을 제거하여 전송해야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      const button = screen.getByRole('button', { name: /컴포넌트 생성/ });

      fireEvent.change(textarea, { target: { value: '   테스트 입력   ' } });
      fireEvent.click(button);

      expect(mockOnGenerate).toHaveBeenCalledWith('테스트 입력');
    });
  });

  describe('키보드 처리 - Ctrl/Cmd+Enter', () => {
    it('Ctrl+Enter로 폼을 제출할 수 있어야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: '키보드 제출 테스트' } });
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

      expect(mockOnGenerate).toHaveBeenCalledWith('키보드 제출 테스트');
    });

    it('Cmd+Enter(Mac)로도 폼을 제출할 수 있어야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Mac 제출 테스트' } });
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });

      expect(mockOnGenerate).toHaveBeenCalledWith('Mac 제출 테스트');
    });

    it('단순 Enter는 줄바꿈만 수행해야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: '첫 번째 줄' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(mockOnGenerate).not.toHaveBeenCalled();
    });
  });

  describe('handleExampleClick 훅 - 예시 프롬프트 처리', () => {
    it('예시 프롬프트 클릭 시 textarea에 값이 설정되어야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const exampleButton = screen.getByRole('button', { name: /SaaS 관리자용/ });
      fireEvent.click(exampleButton);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      expect(textarea.value).toContain('SaaS 관리자용');
    });

    it('예시 프롬프트 클릭 후 제출할 수 있어야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const exampleButton = screen.getByRole('button', { name: /설정 페이지/ });
      fireEvent.click(exampleButton);

      const button = screen.getByRole('button', { name: /컴포넌트 생성/ });
      fireEvent.click(button);

      expect(mockOnGenerate).toHaveBeenCalledWith(expect.stringContaining('알림 토글'));
    });

    it('모든 예시 프롬프트가 클릭 가능해야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const exampleButtons = screen.getAllByRole('button').filter(btn =>
        btn.className.includes('example-chip')
      );

      expect(exampleButtons.length).toBe(6);
    });
  });

  describe('버튼 상태 관리', () => {
    it('isLoading이 false이고 텍스트가 있을 때 버튼이 활성화되어야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      const textarea = screen.getByPlaceholderText(/고객 목록 테이블/) as HTMLTextAreaElement;
      const button = screen.getByRole('button', { name: /컴포넌트 생성/ }) as HTMLButtonElement;

      expect(button.disabled).toBe(true);

      fireEvent.change(textarea, { target: { value: '테스트' } });

      expect(button.disabled).toBe(false);
    });

    it('isLoading이 true일 때 버튼이 비활성화되어야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={true} />);

      const button = screen.getByRole('button', { name: /생성 중/ }) as HTMLButtonElement;

      expect(button.disabled).toBe(true);
    });

    it('isLoading이 true일 때 "생성 중..." 텍스트가 표시되어야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={true} />);

      expect(screen.getByText('생성 중...')).toBeTruthy();
    });

    it('isLoading이 false일 때 "컴포넌트 생성" 텍스트가 표시되어야 한다', () => {
      const mockOnGenerate = vi.fn();
      render(<PromptInput onGenerate={mockOnGenerate} isLoading={false} />);

      expect(screen.getByRole('button', { name: /컴포넌트 생성/ })).toBeTruthy();
    });
  });
});
