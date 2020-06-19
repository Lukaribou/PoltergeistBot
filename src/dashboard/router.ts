export const routes = (app) => {
    app.use('/', require('./routes/index'));
    app.use('/usermenu', require('./routes/userMenu'));
};