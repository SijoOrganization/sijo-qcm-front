import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'newline' })
export class NewlinePipe implements PipeTransform {
  transform(value: string): string {
    return value ? value.replace(/\\n/g, '\n') : '';
  }
}