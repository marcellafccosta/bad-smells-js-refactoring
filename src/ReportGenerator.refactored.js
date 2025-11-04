const VALUE_USER = 500;
const VALUE_PRIORITY = 1000;

export class ReportGenerator {
    constructor(database) {
        this.db = database;
    }

    /**
     * Gera um relatório de itens baseado no tipo e no usuário.
     * - Admins veem tudo.
     * - Users comuns só veem itens com valor <= 500.
     */
    generateReport(reportType, user, items) {
        const formatter = this.getFormatter(reportType);
        const processedItems = this.processItems(user, items);
        return formatter.generate(user, processedItems);
    }

    processItems(user, items) {
        if (user.role === 'ADMIN') {
            return this.processAdminItems(items);
        }
        if (user.role === 'USER') {
            return this.processUserItems(items);
        }
        return items;
    }

    processAdminItems(items) {
        return items.map(item => ({
            ...item,
            priority: item.value > VALUE_PRIORITY
        }));
    }

    processUserItems(items) {
        return items.filter(item => item.value <= VALUE_USER);
    }

    getFormatter(reportType) {
        const formatters = {
            CSV: new CSVFormatter(),
            HTML: new HTMLFormatter(),
        };
        const formatter = formatters[reportType];
        if (!formatter) {
            throw new Error(`Formato de relatório desconhecido: ${reportType}`);
        }
        return formatter;
    }
}

/**
 * Classe base abstrata para formatadores (Template Method)
 */
const ABSTRACT_ERR = 'Método abstrato: implementar na subclasse';

class ReportFormatter {
    // Template Method: estrutura comum a todos os formatadores
    generate(user, items) {
        let report = this.formatHeader(user);
        report += this.formatBody(user, items);
        report += this.formatFooter(items);
        return report.trim();
    }

    // Método utilitário compartilhado
    calculateTotal(items) {
        return items.reduce((sum, item) => sum + item.value, 0);
    }

    // Métodos abstratos (sem parâmetros na base para evitar no-unused-vars)
    formatHeader() {
        throw new Error(ABSTRACT_ERR);
    }
    formatBody() {
        throw new Error(ABSTRACT_ERR);
    }
    formatFooter() {
        throw new Error(ABSTRACT_ERR);
    }
}

class CSVFormatter extends ReportFormatter {
    formatHeader() {
        return 'ID,NOME,VALOR,USUARIO\n';
    }

    formatBody(user, items) {
        return items.map(item => this.formatItem(item, user)).join('\n') + '\n';
    }

    formatItem(item, user) {
        return `${item.id},${item.name},${item.value},${user.name}`;
    }

    formatFooter(items) {
        const total = this.calculateTotal(items);
        return `\nTotal,,\n${total},,\n`;
    }
}

class HTMLFormatter extends ReportFormatter {
    formatHeader(user) {
        return `<html><body>
<h1>Relatório</h1>
<h2>Usuário: ${user.name}</h2>
<table>
<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>
`;
    }

    formatBody(_user, items) {
        return items.map(i => this.formatItem(i)).join('');
    }

    formatItem(item) {
        const style = item.priority ? ' style="font-weight:bold;"' : '';
        return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>
`;
    }

    formatFooter(items) {
        const total = this.calculateTotal(items);
        return `</table>
<h3>Total: ${total}</h3>
</body></html>
`;
    }
}
