const { EditorState, basicSetup } = require("@codemirror/basic-setup");
const { defaultTabBinding } = require("@codemirror/commands");
const { EditorView, keymap } = require("@codemirror/view");
const json = require("@codemirror/lang-json").json;

class Editor {
  constructor(jsonRequestBody, jsonResponseBody) {
    this.basicExtensions = [
      basicSetup,
      keymap.of([defaultTabBinding]),
      json(),
      EditorState.tabSize.of(2),
    ];

    this.requestEditor = new EditorView({
      state: EditorState.create({
        doc: "{\n\t\n}",
        extensions: this.basicExtensions,
      }),
      parent: jsonRequestBody,
    });

    this.responseEditor = new EditorView({
      state: EditorState.create({
        doc: "{}",
        extensions: [...this.basicExtensions, EditorView.editable.of(false)],
      }),
      parent: jsonResponseBody,
    });
  }

  updateResponseEditor(value) {
    this.responseEditor.dispatch({
      changes: {
        from: 0,
        to: this.responseEditor.state.doc.length,
        insert: JSON.stringify(value, null, 2),
      },
    });
  }
}

module.exports = { Editor };
