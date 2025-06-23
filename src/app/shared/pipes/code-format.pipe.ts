import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as hljs from 'highlight.js';

@Pipe({
  name: 'codeFormat',
  standalone: true
})
export class CodeFormatPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';

    // Process text that contains code blocks with backticks
    let processedText = value;

    // Handle markdown-style code blocks
    processedText = processedText.replace(/```([a-z]*)\n([\s\S]*?)```/gm, (match, language, code) => {
      try {
        const highlighted = language
          ? hljs.default.highlight(code, { language }).value
          : hljs.default.highlightAuto(code).value;
        return `<pre><code class="hljs ${language}">${highlighted}</code></pre>`;
      } catch (e) {
        return `<pre><code>${code}</code></pre>`;
      }
    });

    // Handle inline code with single backticks
    processedText = processedText.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Check if the content looks like HTML (for quiz answers with HTML content)
    if (value.includes('<div>') || value.includes('<input')) {
      try {
        // For HTML content, wrap it in a code block with syntax highlighting
        const highlighted = hljs.default.highlight(value, { language: 'html' }).value;
        return this.sanitizer.bypassSecurityTrustHtml(
          `<pre><code class="hljs language-html">${highlighted}</code></pre>`
        );
      } catch (e) {
        // If highlighting fails, just return the sanitized content
        return this.sanitizer.bypassSecurityTrustHtml(value);
      }
    }

    return this.sanitizer.bypassSecurityTrustHtml(processedText);
  }
}
