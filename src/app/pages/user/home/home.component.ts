import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Home</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600">Welcome to OriSharin!</p>
        <p class="text-sm text-gray-500 mt-2">This is the user home page.</p>
      </div>
    </div>
  `
})
export class HomeComponent {
}