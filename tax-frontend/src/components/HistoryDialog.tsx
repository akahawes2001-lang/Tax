import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText,
    IconButton, Alert, CircularProgress, Button, Box, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import { fetchHistory, deleteHistory, clearAllHistory } from '../api';
import { useAuth } from '../context/AuthContext';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';

pdfMake.vfs = pdfFonts.vfs;

interface Props {
    open: boolean;
    onClose: () => void;
}

const HistoryDialog: React.FC<Props> = ({ open, onClose }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [clearing, setClearing] = useState(false);
    const { token } = useAuth();

    const load = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetchHistory();
            setHistory(res.data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => {
        if (open) load();
    }, [open]);

    const handleDelete = async (id: number) => {
        await deleteHistory(id);
        setHistory(prev => prev.filter(h => h.id !== id));
    };

    const handleClearAll = async () => {
        if (!window.confirm('Удалить всю историю расчётов?')) return;
        setClearing(true);
        try {
            await clearAllHistory();
            setHistory([]);
        } catch (err) {
            alert('Не удалось очистить историю');
        } finally {
            setClearing(false);
        }
    };

    const exportSinglePDF = (item: any) => {
        let taxes: { name: string; category: string; tax: number }[] = [];
        try {
            if (item.details_json) {
                const details = JSON.parse(item.details_json);
                if (Array.isArray(details)) taxes = details;
                else if (typeof details === 'object' && details !== null) taxes = [details];
            }
        } catch { }

        const documentDefinition = {
            content: [
                { text: 'Сохранённый расчёт налогов', style: 'header' },
                { text: `Название: ${item.name}`, margin: [0, 5, 0, 5] },
                { text: `Дата сохранения: ${new Date(item.created_at).toLocaleString()}`, margin: [0, 5, 0, 5] },
                { text: `Общая сумма налогов: ${item.tax.toFixed(2)} руб.`, style: 'subheader' },
                taxes.length > 0 ? {
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto'],
                        body: [
                            ['Налог', 'Сумма'],
                            ...taxes.map((t: any) => [t.name, `${t.tax.toFixed(2)} руб.`]),
                        ],
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 10, 0, 10],
                } : { text: 'Детализация отсутствует', margin: [0, 10, 0, 10] },
            ],
            styles: {
                header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 10] },
                subheader: { fontSize: 14, margin: [0, 5] },
            },
            defaultStyle: { font: 'Roboto' },
        };

        pdfMake.createPdf(documentDefinition).download(`расчёт-${item.name}.pdf`);
    };

    const exportSingleXLSX = (item: any) => {
        let taxes: { name: string; category: string; tax: number }[] = [];
        try {
            if (item.details_json) {
                const details = JSON.parse(item.details_json);
                if (Array.isArray(details)) taxes = details;
                else if (typeof details === 'object' && details !== null) taxes = [details];
            }
        } catch { }

        const sheetData = taxes.length > 0
            ? taxes.map((t: any) => ({
                'Налог': t.name,
                'Категория': t.category || '',
                'Сумма (руб.)': t.tax,
            }))
            : [{ 'Налог': item.name, 'Категория': '', 'Сумма (руб.)': item.tax }];

        const sheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.sheet_add_aoa(sheet, [['', '', ''], ['ИТОГО', '', item.tax]], { origin: -1 });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, 'Расчёт');
        XLSX.writeFile(workbook, `расчёт-${item.name}.xlsx`);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                }
            }}
        >
            <DialogTitle>
                История расчётов
                {history.length > 0 && (
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={handleClearAll}
                        disabled={clearing}
                        sx={{ float: 'right' }}
                    >
                        {clearing ? 'Очистка...' : 'Очистить всё'}
                    </Button>
                )}
            </DialogTitle>
            <DialogContent>
                {loading ? <CircularProgress /> : (
                    history.length === 0 ? (
                        <Alert severity="info">История пуста</Alert>
                    ) : (
                        <List>
                            {history.map((h: any) => (
                                <ListItem
                                    key={h.id}
                                    secondaryAction={
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Скачать PDF">
                                                <IconButton size="small" onClick={() => exportSinglePDF(h)}>
                                                    <PictureAsPdfIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Скачать XLSX">
                                                <IconButton size="small" onClick={() => exportSingleXLSX(h)}>
                                                    <TableChartIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton edge="end" onClick={() => handleDelete(h.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={h.name}
                                        secondary={`${h.tax.toFixed(2)} руб. – ${new Date(h.created_at).toLocaleString()}`}
                                        secondaryTypographyProps={{ color: 'text.secondary' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )
                )}
            </DialogContent>
        </Dialog>
    );
};

export default HistoryDialog;