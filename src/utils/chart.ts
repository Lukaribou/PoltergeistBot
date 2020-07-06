export class QuickChart {
    chart: any;
    bkgColor: string;

    constructor() {
        this.chart = undefined;
        this.bkgColor = '#FFFFFF';
    }

    public setConfig(cfg: any): QuickChart {
        this.chart = JSON.stringify(cfg);
        return this;
    }

    public setBackgroundColor(clr: string): QuickChart {
        this.bkgColor = clr;
        return this;
    }

    public setTextColor(clr: string): QuickChart {
        let t = JSON.parse(this.chart);
        t.options = {
            legend: {
                labels: {
                    fontColor: clr
                }
            },
            scales: {
                yAxes: [{
                    ticks: {
                        fontColor: clr
                    },
                }],
                xAxes: [{
                    ticks: {
                        fontColor: clr
                    },
                }]
            }
        };
        return this.setConfig(t);
    }

    private isValid(): boolean {
        return this.chart !== undefined
    }

    public generateUrl(): string {
        if (!this.isValid()) throw new Error('You must call setConfig before getUrl');

        const ret = new URL('https://quickchart.io/chart');
        ret.searchParams.append('c', this.chart);
        ret.searchParams.append('w', '500'); // width
        ret.searchParams.append('h', '300'); // height
        ret.searchParams.append('bkg', this.bkgColor);

        return ret.href;
    }
}