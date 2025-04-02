# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

### FEATURES TO ADD
- [x] Ensure that you cant go to a chats room page if the chatroom does not exist
- [X] BUG: signing into a new session causes an infinite rerender.
- [X] Create an error Page
- [X] BUG: SORT MESSAGES BY DATE SENT NOT WORKING CORRECTLY
  - [ ] fix. But I am using js sort to sort the messages by date sent. Would like this to be a db query.
- [ ] Sidebar has a scroll. And fix to enable no scroll for elements on sidebar
- [ ] BUG: Clicking on `New Private Chat` on mobile closes the modal for selecting a new chat
- [ ] FEAT: Implement saving timezones to the DB and the current time a message or chat was sent at.
- [ ] FEAT: The replaceZWithCSTOffset function has a TODO comment about handling provided timezones but currently only handles UTC
- [ ] FEAT: The timeDifference function hardcodes "America/Chicago" timezone instead of using the user's timezone
- [ ] FEAT: The formatDate function also hardcodes "America/Chicago" timezone
