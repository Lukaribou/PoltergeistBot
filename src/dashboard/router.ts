export const routes = (app) => {
    app.use('/', require('./routes/index'));
    app.user('/usermenu/', require('./routes/userMenu'));
};