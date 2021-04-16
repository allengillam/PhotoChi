namespace pc.Common {

    export class DateHelpers {

        public static formatDate(date: Date): string {
            let dte: string = ""
            if (date.getDate() < 10) {
                dte += '0' + date.getDate();
            } else {
                dte += date.getDate();
            }
            let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            dte += ' ' + months[date.getMonth()];
            dte += ' ' + date.getFullYear();
            if (date.getHours() < 10) {
                dte += ' 0' + date.getHours();
            } else {
                dte += ' ' + date.getHours();
            }
            if (date.getMinutes() < 10) {
                dte += ':0' + date.getMinutes();
            } else {
                dte += ':' + date.getMinutes();
            }
            return dte;
        }

        public static formatJsonDate(date: Date): string {
            let dte: string = ""
            dte += date.getFullYear();
            if (date.getMonth() < 10) {
                dte += '-0' + (date.getMonth() + 1);
            } else {
                dte += "-" + (date.getMonth() + 1);
            }
            if (date.getDate() < 10) {
                dte += '-0' + date.getDate();
            } else {
                dte += "-" + date.getDate();
            }
            return dte;
        }

        public static addDays(date: Date, days: number): Date {
            let newDate: Date = new Date(date.valueOf());
            newDate.setDate(date.getDate() + days);
            return newDate;
        }        

    }




}