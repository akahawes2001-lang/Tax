import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Paper, Typography, Button, useMediaQuery, useTheme,
    IconButton, Fade, LinearProgress
} from '@mui/material';
import {
    ChevronLeft, ChevronRight, HelpOutlineOutlined, SaveOutlined, FileDownloadOutlined, RestartAlt
} from '@mui/icons-material';
import IncomeStep from './IncomeStep';
import DeductionsStep from './DeductionsStep';
import PetsStep from './PetsStep';
import TransportStep from './TransportStep';
import PropertyStep from './PropertyStep';
import LandTaxStep from './LandTaxStep';
import CraftStep from './CraftStep';
import AgroStep from './AgroStep';
import IpTaxStep from './IpTaxStep';
import DepositStep from './DepositStep';
import OtherIncomesStep from './OtherIncomesStep';
import ResultsStep from './ResultsStep';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import { useTaxContext } from '../context/TaxContext';

const STEPS = [
    'Доходы', 'Удержания', 'Животные', 'Транспорт', 'Недвижимость',
    'Земельный налог', 'Ремесленный сбор', 'Агроэкотуризм',
    'Единый налог (ИП)', 'Вклады', 'Прочие доходы', 'Результаты'
];

const STEP_COMPONENTS: React.ReactNode[] = [
    <IncomeStep />, <DeductionsStep />, <PetsStep />,
    <TransportStep />, <PropertyStep />, <LandTaxStep />,
    <CraftStep />, <AgroStep />, <IpTaxStep />,
    <DepositStep />, <OtherIncomesStep />, <ResultsStep />
];

const TOTAL_STEPS = STEPS.length;

const Layout: React.FC = () => {
    const { currentStep, setCurrentStep } = useTaxContext();
    void useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleNext = () => setCurrentStep(Math.min(currentStep + 1, TOTAL_STEPS - 1));
    const handleBack = () => setCurrentStep(Math.max(currentStep - 1, 0));
    const handleReset = () => setCurrentStep(0);

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === TOTAL_STEPS - 1;
    const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;

    // Мемоизируем компонент шага для предотвращения лишних ререндеров
    const stepComponent = useMemo(() => STEP_COMPONENTS[currentStep], [currentStep]);

    const handleSaveCurrent = () => {
        // Триггерим сохранение через кнопку в ResultsStep, если есть
        const saveBtn = document.querySelector('[data-save-calculation]');
        if (saveBtn) (saveBtn as HTMLElement).click();
    };

    const handleExportPdf = () => {
        const pdfBtn = document.querySelector('[data-export-pdf]');
        if (pdfBtn) (pdfBtn as HTMLElement).click();
    };

    const handleExportXlsx = () => {
        const xlsxBtn = document.querySelector('[data-export-xlsx]');
        if (xlsxBtn) (xlsxBtn as HTMLElement).click();
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Header />

            <Container maxWidth="lg" sx={{ mt: { xs: 1, sm: 2, md: 3 }, mb: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
                {/* Хедер шагов */}
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    mb: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', gap: 1
                }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' } }}>
                            Расчёт налогов
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
                            Шаг {currentStep + 1} из {TOTAL_STEPS} — {STEPS[currentStep]}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                            onClick={() => navigate('/knowledge')}
                            size={isMobile ? 'small' : 'medium'}
                            sx={{ color: 'text.secondary' }}
                            title="Обучение и справка"
                        >
                            <HelpOutlineOutlined />
                        </IconButton>
                        <IconButton
                            onClick={() => navigate('/history')}
                            size={isMobile ? 'small' : 'medium'}
                            sx={{ color: 'text.secondary' }}
                            title="Сохранённые расчёты"
                        >
                            <FileDownloadOutlined />
                        </IconButton>
                    </Box>
                </Box>

                {/* Прогресс (точки) */}
                <Box sx={{ mb: { xs: 1.5, sm: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', mb: 1 }}>
                        {STEPS.map((_, index) => {
                            const isActive = index === currentStep;
                            const isCompleted = index < currentStep;
                            return (
                                <Box
                                    key={index}
                                    onClick={() => setCurrentStep(index)}
                                    sx={{
                                        width: isActive ? 24 : 8,
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: isCompleted ? 'primary.main' : isActive ? 'primary.main' : 'divider',
                                        opacity: isActive ? 1 : isCompleted ? 0.7 : 0.4,
                                        cursor: isCompleted || isActive ? 'pointer' : 'default',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { opacity: 1 },
                                    }}
                                />
                            );
                        })}
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progressPercent}
                        sx={{
                            height: 3,
                            borderRadius: 2,
                            bgcolor: 'divider',
                            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', borderRadius: 2 }
                        }}
                    />
                </Box>

                {/* Степпер (горизонтальный список шагов) */}
                <Box sx={{
                    display: 'flex', overflowX: 'auto', gap: 0.5, mb: { xs: 1.5, sm: 2.5 },
                    pb: 1, px: { xs: 0.5, sm: 0 },
                    '&::-webkit-scrollbar': { height: 3 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
                    scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch',
                }}>
                    {STEPS.map((label, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;
                        let color = 'text.disabled';
                        let fontWeight = 400;
                        let bgColor = 'transparent';
                        if (isActive) {
                            color = 'primary.main';
                            fontWeight = 700;
                            bgColor = 'rgba(20, 184, 166, 0.08)';
                        } else if (isCompleted) {
                            color = 'text.secondary';
                        }
                        return (
                            <Box
                                key={label}
                                onClick={() => setCurrentStep(index)}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.75,
                                    px: { xs: 1, sm: 1.5 }, py: { xs: 0.5, sm: 0.75 },
                                    borderRadius: 2, cursor: 'pointer', bgcolor: bgColor,
                                    transition: 'all 0.2s ease', whiteSpace: 'nowrap', flexShrink: 0,
                                    '&:hover': { bgcolor: isActive ? 'rgba(20, 184, 166, 0.12)' : 'action.hover' },
                                }}
                            >
                                <Box sx={{
                                    width: { xs: 22, sm: 24 }, height: { xs: 22, sm: 24 },
                                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: { xs: 11, sm: 12 },
                                    fontWeight: 700, flexShrink: 0,
                                    bgcolor: isActive ? 'primary.main' : isCompleted ? 'text.secondary' : 'action.disabledBackground',
                                    color: isActive ? '#fff' : isCompleted ? '#fff' : 'text.disabled',
                                    transition: 'all 0.2s ease',
                                }}>
                                    {isCompleted ? '✓' : index + 1}
                                </Box>
                                <Typography variant="body2" sx={{
                                    color, fontWeight,
                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    display: { xs: isActive ? 'block' : 'none', sm: 'block' },
                                    userSelect: 'none',
                                }}>
                                    {label}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>

                {/* Контент шага */}
                <Fade in={true} key={currentStep} timeout={300}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 1.5, sm: 2.5, md: 3 },
                            borderRadius: '12px',
                            bgcolor: (theme) =>
                                theme.palette.mode === 'dark'
                                    ? 'rgba(7, 13, 29, 0.85)'
                                    : 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid',
                            borderColor: 'divider',
                            minHeight: { xs: 250, sm: 300, md: 350 },
                        }}
                    >
                        {stepComponent}
                    </Paper>
                </Fade>

                {/* Навигация снизу */}
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    mt: 2, gap: 1, flexDirection: { xs: 'column', sm: 'row' },
                }}>
                    {/* Кнопка Назад */}
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                        <Button
                            onClick={handleBack}
                            disabled={isFirstStep}
                            variant="outlined"
                            startIcon={<ChevronLeft />}
                            fullWidth={isMobile}
                            sx={{ borderRadius: '10px', minWidth: { sm: 120 } }}
                        >
                            Назад
                        </Button>
                    </Box>

                    {/* Точки прогресса */}
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5 }}>
                        {STEPS.map((_, index) => (
                            <Box
                                key={index}
                                sx={{
                                    width: index === currentStep ? 10 : 6,
                                    height: index === currentStep ? 10 : 6,
                                    borderRadius: '50%',
                                    bgcolor: index <= currentStep ? 'primary.main' : 'divider',
                                    opacity: index <= currentStep ? 1 : 0.4,
                                    transition: 'all 0.3s ease',
                                }}
                            />
                        ))}
                    </Box>

                    {/* Кнопка Далее / Действия на последнем шаге */}
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        {isLastStep ? (
                            <>
                                <Button
                                    variant="outlined"
                                    startIcon={<RestartAlt />}
                                    onClick={handleReset}
                                    fullWidth={isMobile}
                                    sx={{ borderRadius: '10px' }}
                                >
                                    Начать заново
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveOutlined />}
                                    onClick={handleSaveCurrent}
                                    fullWidth={isMobile}
                                    sx={{ borderRadius: '10px' }}
                                    data-save-trigger
                                >
                                    Сохранить
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<FileDownloadOutlined />}
                                    onClick={handleExportPdf}
                                    fullWidth={isMobile}
                                    sx={{ borderRadius: '10px', display: { xs: 'none', md: 'inline-flex' } }}
                                >
                                    PDF
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleExportXlsx}
                                    fullWidth={isMobile}
                                    sx={{ borderRadius: '10px', display: { xs: 'none', md: 'inline-flex' } }}
                                >
                                    XLSX
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                endIcon={<ChevronRight />}
                                onClick={handleNext}
                                fullWidth={isMobile}
                                sx={{ borderRadius: '10px', minWidth: { sm: 140 } }}
                            >
                                {currentStep === TOTAL_STEPS - 2 ? 'К результатам' : 'Далее'}
                            </Button>
                        )}
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Layout;