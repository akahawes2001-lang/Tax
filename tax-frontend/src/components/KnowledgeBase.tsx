import React from 'react';
import {
  Box, Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails,
  Tabs, Tab, useTheme, useMediaQuery, Card, CardContent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import ChairIcon from '@mui/icons-material/Chair';
import HealingIcon from '@mui/icons-material/Healing';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import PaymentsIcon from '@mui/icons-material/Payments';
import Header from './Header';
import Footer from './Footer';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`knowledge-tabpanel-${index}`}
      aria-labelledby={`knowledge-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: { xs: 2, md: 3 } }}>{children}</Box>}
    </Box>
  );
}

const faqItems = [
  {
    question: 'Как рассчитывается подоходный налог?',
    answer: 'В Беларуси действует прогрессивная шкала подоходного налога: при доходе до 350 000 руб. в год ставка составляет 13%, от 350 001 до 600 000 руб. — 25%, свыше 600 000 руб. — 30%. Также применяются стандартные, социальные и имущественные вычеты, которые уменьшают налогооблагаемую базу.',
  },
  {
    question: 'Какие вычеты можно получить на детей?',
    answer: 'Стандартный налоговый вычет на детей составляет 63 руб. в месяц на каждого ребёнка. Для одиноких родителей, многодетных семей (трое и более детей) вычет увеличен до 120 руб. в месяц на каждого ребёнка. На ребёнка-инвалида также предусмотрен вычет 120 руб. в месяц.',
  },
  {
    question: 'Нужно ли платить налог с продажи квартиры?',
    answer: 'Если вы владели квартирой более 5 лет и это единственное жильё — налог платить не нужно. В иных случаях налог составляет 13% с разницы между ценой продажи и ценой покупки (либо с применением фиксированного вычета 20% от суммы продажи). Рекомендуем уточнить детали в МНС.',
  },
  {
    question: 'Что такое транспортный налог и как он рассчитывается?',
    answer: 'Транспортный налог зависит от массы автомобиля, года выпуска и типа транспортного средства. Для легковых авто ставки варьируются от 0 до 300+ руб. в год. Электромобили полностью освобождены от налога. Предусмотрены льготы для инвалидов, ветеранов и многодетных семей. На роскошные авто (дороже 300 000 руб.) применяется повышающий коэффициент ×10.',
  },
  {
    question: 'Облагаются ли вклады налогом?',
    answer: 'Проценты по банковским вкладам облагаются подоходным налогом по ставке 13%. Однако есть освобождение: вклады в BYN на срок 12 месяцев и более, а также валютные вклады на 24 месяца и более не облагаются налогом. Наш калькулятор учитывает все эти нюансы.',
  },
  {
    question: 'Какие налоги платят ИП?',
    answer: 'Индивидуальные предприниматели без наёмных работников платят единый налог по фиксированным ставкам, которые зависят от вида деятельности и населённого пункта. Например, в Минске ставки выше, чем в небольших городах. Наш калькулятор поможет рассчитать точную сумму для вашего случая.',
  },
  {
    question: 'Есть ли налог на собак?',
    answer: 'Да, в Беларуси действует налог на содержание собак. Для неопасных пород ставка составляет 14 руб. в квартал, для потенциально опасных пород — 67 руб. в квартал. Льготы предоставляются пенсионерам и многодетным семьям. Наш калькулятор включает умный поиск породы.',
  },
  {
    question: 'Как подтвердить email при регистрации?',
    answer: 'После регистрации на сервисе TaxBel появится диалоговое окно. Нажмите «Подтвердить email» — на указанный адрес придёт письмо с ссылкой. Перейдите по ссылке для завершения подтверждения. Если письмо не пришло, проверьте папку «Спам» или запросите повторную отправку.',
  },
  {
    question: 'Можно ли экспортировать расчёты?',
    answer: 'Да, вы можете экспортировать свои расчёты в форматах PDF (сводный отчёт, детализация или налоговая декларация) и Excel. Экспорт доступен на странице результатов без ограничений, даже без регистрации.',
  },
  {
    question: 'Куда обращаться, если расчёт не совпадает с реальным?',
    answer: 'Калькулятор TaxBel даёт ознакомительные цифры и не заменяет официальных расчётов. В случае расхождений рекомендуем обратиться в Министерство по налогам и сборам Республики Беларусь по месту жительства для получения точной информации по вашей ситуации.',
  },
];

const benefits = [
  {
    icon: <TrendingUpIcon sx={{ fontSize: { xs: 28, md: 36 }, color: '#14B8A6' }} />,
    title: 'Инвестиционный вычет (ИИС) с 2026',
    description: 'Можно вернуть налог с дохода, вложенного в ценные бумаги на 3+ года, до 1 200 000 руб. Отличная возможность для долгосрочных инвесторов.',
  },
  {
    icon: <SchoolIcon sx={{ fontSize: { xs: 28, md: 36 }, color: '#3B82F6' }} />,
    title: 'Освобождение для молодых специалистов',
    description: 'Молодые специалисты имеют право на вычет 860 руб./мес. в течение срока обязательной работы по распределению. Значительная экономия на подоходном налоге.',
  },
  {
    icon: <FamilyRestroomIcon sx={{ fontSize: { xs: 28, md: 36 }, color: '#10B981' }} />,
    title: 'Льгота по транспортному налогу для многодетных',
    description: 'Многодетные семьи (трое и более детей) освобождаются от уплаты транспортного налога на один автомобиль. Не забудьте подать заявление в МНС.',
  },
  {
    icon: <ChairIcon sx={{ fontSize: { xs: 28, md: 36 }, color: '#8B5CF6' }} />,
    title: 'Освобождение от налога на недвижимость для пенсионеров',
    description: 'Пенсионеры освобождаются от налога на недвижимость на один объект каждого типа: квартира, жилой дом, гараж. Льгота применяется автоматически.',
  },
  {
    icon: <HealingIcon sx={{ fontSize: { xs: 28, md: 36 }, color: '#EF4444' }} />,
    title: 'Чернобыльцы освобождены от земельного налога',
    description: 'Граждане, пострадавшие от катастрофы на ЧАЭС, полностью освобождаются от уплаты земельного налога и налога на недвижимость. Льгота действует бессрочно.',
  },
  {
    icon: <MilitaryTechIcon sx={{ fontSize: { xs: 28, md: 36 }, color: '#F59E0B' }} />,
    title: 'Ветераны боевых действий — без транспортного налога',
    description: 'Ветераны боевых действий на территории других государств освобождены от уплаты транспортного налога. Льгота предоставляется на одно транспортное средство.',
  },
  {
    icon: <AgricultureIcon sx={{ fontSize: { xs: 28, md: 36 }, color: '#22C55E' }} />,
    title: 'Доход от продажи урожая не облагается',
    description: 'Доход от продажи продукции, выращенной на личном подсобном хозяйстве, не облагается подоходным налогом, если участок не превышает 0.5 га.',
  },
  {
    icon: <PaymentsIcon sx={{ fontSize: { xs: 28, md: 36 }, color: '#FF6B35' }} />,
    title: 'Стандартный вычет 216 руб./мес.',
    description: 'Если ваш доход менее 1308 руб. в месяц, вы имеете право на стандартный налоговый вычет 216 руб. в месяц. Вычет применяется ежемесячно.',
  },
];

const KnowledgeBase: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? '#030711' : '#F8FAFC', minHeight: '100vh' }}>
      <Header />

      {/* Hero */}
      <Box sx={{ textAlign: 'center', pt: { xs: 4, md: 8 }, pb: { xs: 2, md: 4 } }}>
        <Container maxWidth="md">
          <Typography
            variant="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '1.8rem', md: '3rem' },
              color: 'text.primary',
              mb: 1,
            }}
          >
            База знаний
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '0.85rem', md: '1rem' }, maxWidth: 500, mx: 'auto' }}>
            Налоги, льготы и ответы на популярные вопросы — всё в одном месте
          </Typography>
        </Container>
      </Box>

      {/* Tabs */}
      <Container maxWidth="md">
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered={!isMobile}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{
            mb: { xs: 1, md: 2 },
            '& .MuiTab-root': {
              fontWeight: 700,
              fontSize: { xs: '0.8rem', md: '1rem' },
              textTransform: 'none',
              color: 'text.secondary',
              '&.Mui-selected': { color: 'primary.main' },
            },
            '& .MuiTabs-indicator': { backgroundColor: 'primary.main' },
          }}
        >
          <Tab label="Часто задаваемые вопросы" icon={<ContactSupportIcon sx={{ fontSize: { xs: 18, md: 22 } }} />} iconPosition="start" />
          <Tab label="Льготы и налоги, о которых вы не знали" icon={<AccountBalanceIcon sx={{ fontSize: { xs: 18, md: 22 } }} />} iconPosition="start" />
        </Tabs>
      </Container>

      {/* FAQ */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ px: { xs: 2, sm: 4, md: 16 }, pb: { xs: 6, md: 12 } }}>
          <Container maxWidth="md">
            <Paper
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? '#070d1d' : '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              {faqItems.map((item, index) => (
                <Accordion
                  key={index}
                  sx={{
                    bgcolor: 'transparent',
                    borderBottom: index < faqItems.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': { margin: 0 },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
                    sx={{
                      px: { xs: 2, md: 3 },
                      py: { xs: 0.5, md: 0.5 },
                      '&.Mui-expanded': { borderBottom: '1px solid', borderColor: 'divider' },
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: '0.85rem', md: '1rem' },
                        color: 'text.primary',
                        pr: 2,
                      }}
                    >
                      {item.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: { xs: 2, md: 3 }, py: { xs: 1.5, md: 2 } }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: { xs: '0.82rem', md: '0.92rem' },
                        lineHeight: 1.7,
                      }}
                    >
                      {item.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
          </Container>
        </Box>
      </TabPanel>

      {/* Льготы */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ px: { xs: 2, sm: 4, md: 16 }, pb: { xs: 6, md: 12 } }}>
          <Container maxWidth="md">
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.2rem', md: '1.5rem' },
                color: 'text.primary',
                textAlign: 'center',
                mb: { xs: 2, md: 3 },
              }}
            >
              Налоговые льготы, которые вы могли упустить
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.8rem', md: '0.9rem' },
                textAlign: 'center',
                mb: { xs: 3, md: 4 },
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              Многие налогоплательщики не знают о своём праве на льготы. Проверьте, какие из них применимы к вам.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: '12px' }}>
              {benefits.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    width: { xs: '100%', sm: 'calc(50% - 12px)' },
                    display: 'flex',
                  }}
                >
                  <Card
                    sx={{
                      width: '100%',
                      bgcolor: theme.palette.mode === 'dark' ? '#070d1d' : '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 12px 24px rgba(20,184,166,0.2)',
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, md: 2 } }}>
                        <Box
                          sx={{
                            width: { xs: 44, md: 52 },
                            height: { xs: 44, md: 52 },
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(20,184,166,0.08)',
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: '0.85rem', md: '0.95rem' },
                              color: 'text.primary',
                              mb: 0.5,
                              lineHeight: 1.3,
                            }}
                          >
                            {item.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: '0.75rem', md: '0.85rem' },
                              color: 'text.secondary',
                              lineHeight: 1.5,
                            }}
                          >
                            {item.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>

            {/* Нижний блок */}
            <Box
              sx={{
                mt: { xs: 4, md: 6 },
                p: { xs: 2.5, md: 4 },
                bgcolor: theme.palette.mode === 'dark' ? '#070d1d' : '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'rgba(20,184,166,0.25)',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: '0.8rem', md: '0.9rem' },
                  lineHeight: 1.6,
                }}
              >
                💡 <strong>Важно:</strong> Для применения большинства льгот необходимо подать заявление в налоговый орган по месту жительства.
                Калькулятор TaxBel поможет предварительно оценить сумму налогов с учётом применимых льгот.
              </Typography>
            </Box>
          </Container>
        </Box>
      </TabPanel>

      <Footer />
    </Box>
  );
};

export default KnowledgeBase;