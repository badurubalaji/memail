import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MailLayoutComponent } from './components/mail-layout.component';
import { MailListComponent } from './components/mail-list.component';
import { MailDetailComponent } from './components/mail-detail.component';
import { EnhancedComposeComponent } from './components/enhanced-compose.component';
import { DraftEditorComponent } from './components/draft-editor.component';

const routes: Routes = [
  {
    path: '',
    component: MailLayoutComponent,
    children: [
      {
        path: 'inbox',
        children: [
          { path: '', component: MailListComponent, data: { folder: 'INBOX' } },
          { path: ':threadId', component: MailDetailComponent, data: { folder: 'INBOX' } }
        ]
      },
      {
        path: 'sent',
        children: [
          { path: '', component: MailListComponent, data: { folder: 'SENT' } },
          { path: ':threadId', component: MailDetailComponent, data: { folder: 'SENT' } }
        ]
      },
      {
        path: 'drafts',
        children: [
          { path: '', component: MailListComponent, data: { folder: 'DRAFTS' } },
          { path: ':threadId', component: DraftEditorComponent, data: { folder: 'DRAFTS' } }
        ]
      },
      {
        path: 'trash',
        children: [
          { path: '', component: MailListComponent, data: { folder: 'TRASH' } },
          { path: ':threadId', component: MailDetailComponent, data: { folder: 'TRASH' } }
        ]
      },
      {
        path: 'compose',
        component: EnhancedComposeComponent
      },
      {
        path: '',
        redirectTo: 'inbox',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MailRoutingModule { }