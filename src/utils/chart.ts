import * as https from "https";

const options = {
    hostname: 'quickchart.io',
    path: '/chart/create',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
}

export class QuickChart {
    chart: any;
    bkgColor: string;

    constructor() {
        this.chart = {
            type: '',
            data: {
                labels: [],
                datasets: []
            }
        };
        this.bkgColor = '#FFFFFF';
    }

    /**
     * Change le type du graphique
     * @param type Type de graphique
     */
    public setType(type: string): QuickChart {
        this.chart.type = type;
        return this;
    }

    /**
     * Change les labels sur l'axe des abscisses
     * @param lbls Les labels à afficher
     */
    public setXLabels(lbls: any[]): QuickChart {
        this.chart.data.labels = lbls;
        return this;
    }

    /**
     * 
     * @param lbl Label à associer
     * @param dt Les données
     * @param opt Des options (facultatif)
     */
    public addData(lbl: string, dt: any[], opt?: any): QuickChart {
        var data = {
            label: lbl,
            data: dt
        };
        for (let k in opt) {
            Object.defineProperty(data, k, {
                value: opt[k],
                enumerable: true
            });
        }
        this.chart.data.datasets.push(data);
        return this;
    }

    /**
     * Change la couleur de fond
     * @param clr Couleur du fond
     */
    public setBackgroundColor(clr: string): QuickChart {
        this.bkgColor = clr;
        return this;
    }

    /**
     * Change la couleur du texte
     * Ecrase les options
     * @param clr Couleur du texte
     */
    public setTextColor(clr: string): QuickChart {
        Object.defineProperty(this.chart, "options", {
            enumerable: true,
            value: {
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
            }
        });
        return this;
    }

    public createSpecial(o: Object): QuickChart {
        this.chart = o;
        return this;
    }

    /**
     * Change les options du graphique
     * Ecrase les options
     * @param opts Les options
     */
    public setChartOptions(opts: any): QuickChart {
        Object.defineProperty(this.chart, "options", {
            enumerable: true,
            value: opts
        });
        return this;
    }

    /**
     * Génère le graphique sans passer par le serveur de quickchart.io
     * Est soumis à la longueur max d'une URL
     */
    public generateUrl(): string {
        this.chart = JSON.stringify(this.chart);

        const ret = new URL('https://quickchart.io/chart');
        ret.searchParams.append('c', this.chart);
        ret.searchParams.append('w', '500'); // width
        ret.searchParams.append('h', '300'); // height
        ret.searchParams.append('bkg', this.bkgColor);

        return ret.href;
    }

    /**
     * Renvoie les données sous la forme requise par requestShortUrl()
     */
    private getDatas() {
        return JSON.stringify({
            width: 500,
            height: 300,
            backgroundColor: this.bkgColor,
            format: 'png',
            chart: this.chart
        });
    }

    /**
     * Renvoie une URL courte venant de quickchart.io
     * N'est pas soumis à la longueur max d'une URL
     */
    public async requestShortUrl(): Promise<string> {
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                var data = '';
                res.on('data', (d) => data += d)
                    .on('end', () => resolve(JSON.parse(data).url))
                    .on('error', (err) => reject(err));
            });
            req.write(this.getDatas())
            req.end();
        });
    }
}