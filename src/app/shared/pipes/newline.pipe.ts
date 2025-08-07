import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ 
  name: 'newline',
  standalone: true 
})
export class NewlinePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    
    // Remplace les \n échappés et les vrais \n par des <br>
    return value
      .replace(/\\n/g, '<br>')
      .replace(/\n/g, '<br>');
  }
}