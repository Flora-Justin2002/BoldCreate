import React, { useState } from 'react';
import { RichTextEditorComponent, Toolbar, Inject, HtmlEditor, Link, QuickToolbar, Image } from '@syncfusion/ej2-react-richtexteditor';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { PageHeader } from '../components/Ui.jsx';
import { useStore } from '../store.jsx';
import { sanitize } from '../utils.js';

export default function Announcements() {
  const { announcement, setAnnouncement, notify } = useStore();
  const [html, setHtml] = useState(announcement);
  const items = ['Bold', 'Italic', 'Underline', '|', 'Formats', 'Alignments', 'OrderedList', 'UnorderedList', '|', 'CreateLink', '|', 'Undo', 'Redo'];

  return (
    <>
      <PageHeader title="Announcements" subtitle="Compose the store banner shown to shoppers on the Shop page" />
      <div className="grid-2">
        <section className="panel">
          <h3>Editor</h3>
          <RichTextEditorComponent value={html} change={(e) => setHtml(e.value)} height={320} toolbarSettings={{ items }}>
            <Inject services={[Toolbar, HtmlEditor, Link, QuickToolbar, Image]} />
          </RichTextEditorComponent>
          <div className="form-actions">
            <ButtonComponent cssClass="e-primary" onClick={() => { setAnnouncement(sanitize(html)); notify('Published', 'Banner updated on the storefront.'); }}>Publish</ButtonComponent>
          </div>
        </section>
        <section className="panel">
          <h3>Preview</h3>
          <div className="banner" dangerouslySetInnerHTML={{ __html: sanitize(html) }} />
        </section>
      </div>
    </>
  );
}
