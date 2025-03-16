// app/styles/bootstrap.js
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Colors similar to Bootstrap
const colors = {
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  white: '#ffffff',
  muted: '#6c757d',
  black: '#000000',
};

// Spacing in Bootstrap is based on 1rem (16px)
const spacer = 16;

export const BootstrapStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    paddingHorizontal: spacer,
  },
  containerFluid: {
    flex: 1,
    width: '100%',
  },

  // Margin and padding (m-1, p-1, etc.)
  m0: { margin: 0 },
  m1: { margin: spacer * 0.25 },
  m2: { margin: spacer * 0.5 },
  m3: { margin: spacer },
  m4: { margin: spacer * 1.5 },
  m5: { margin: spacer * 3 },
  
  mt0: { marginTop: 0 },
  mt1: { marginTop: spacer * 0.25 },
  mt2: { marginTop: spacer * 0.5 },
  mt3: { marginTop: spacer },
  mt4: { marginTop: spacer * 1.5 },
  mt5: { marginTop: spacer * 3 },
  
  mb0: { marginBottom: 0 },
  mb1: { marginBottom: spacer * 0.25 },
  mb2: { marginBottom: spacer * 0.5 },
  mb3: { marginBottom: spacer },
  mb4: { marginBottom: spacer * 1.5 },
  mb5: { marginBottom: spacer * 3 },
  
  ml0: { marginLeft: 0 },
  ml1: { marginLeft: spacer * 0.25 },
  ml2: { marginLeft: spacer * 0.5 },
  ml3: { marginLeft: spacer },
  ml4: { marginLeft: spacer * 1.5 },
  ml5: { marginLeft: spacer * 3 },
  
  mr0: { marginRight: 0 },
  mr1: { marginRight: spacer * 0.25 },
  mr2: { marginRight: spacer * 0.5 },
  mr3: { marginRight: spacer },
  mr4: { marginRight: spacer * 1.5 },
  mr5: { marginRight: spacer * 3 },
  
  mx0: { marginHorizontal: 0 },
  mx1: { marginHorizontal: spacer * 0.25 },
  mx2: { marginHorizontal: spacer * 0.5 },
  mx3: { marginHorizontal: spacer },
  mx4: { marginHorizontal: spacer * 1.5 },
  mx5: { marginHorizontal: spacer * 3 },
  
  my0: { marginVertical: 0 },
  my1: { marginVertical: spacer * 0.25 },
  my2: { marginVertical: spacer * 0.5 },
  my3: { marginVertical: spacer },
  my4: { marginVertical: spacer * 1.5 },
  my5: { marginVertical: spacer * 3 },
  
  p0: { padding: 0 },
  p1: { padding: spacer * 0.25 },
  p2: { padding: spacer * 0.5 },
  p3: { padding: spacer },
  p4: { padding: spacer * 1.5 },
  p5: { padding: spacer * 3 },
  
  pt0: { paddingTop: 0 },
  pt1: { paddingTop: spacer * 0.25 },
  pt2: { paddingTop: spacer * 0.5 },
  pt3: { paddingTop: spacer },
  pt4: { paddingTop: spacer * 1.5 },
  pt5: { paddingTop: spacer * 3 },
  
  pb0: { paddingBottom: 0 },
  pb1: { paddingBottom: spacer * 0.25 },
  pb2: { paddingBottom: spacer * 0.5 },
  pb3: { paddingBottom: spacer },
  pb4: { paddingBottom: spacer * 1.5 },
  pb5: { paddingBottom: spacer * 3 },
  
  pl0: { paddingLeft: 0 },
  pl1: { paddingLeft: spacer * 0.25 },
  pl2: { paddingLeft: spacer * 0.5 },
  pl3: { paddingLeft: spacer },
  pl4: { paddingLeft: spacer * 1.5 },
  pl5: { paddingLeft: spacer * 3 },
  
  pr0: { paddingRight: 0 },
  pr1: { paddingRight: spacer * 0.25 },
  pr2: { paddingRight: spacer * 0.5 },
  pr3: { paddingRight: spacer },
  pr4: { paddingRight: spacer * 1.5 },
  pr5: { paddingRight: spacer * 3 },
  
  px0: { paddingHorizontal: 0 },
  px1: { paddingHorizontal: spacer * 0.25 },
  px2: { paddingHorizontal: spacer * 0.5 },
  px3: { paddingHorizontal: spacer },
  px4: { paddingHorizontal: spacer * 1.5 },
  px5: { paddingHorizontal: spacer * 3 },
  
  py0: { paddingVertical: 0 },
  py1: { paddingVertical: spacer * 0.25 },
  py2: { paddingVertical: spacer * 0.5 },
  py3: { paddingVertical: spacer },
  py4: { paddingVertical: spacer * 1.5 },
  py5: { paddingVertical: spacer * 3 },

  // Flex utilities
  flexRow: { flexDirection: 'row' },
  flexColumn: { flexDirection: 'column' },
  flexWrap: { flexWrap: 'wrap' },
  flexNowrap: { flexWrap: 'nowrap' },
  flexGrow: { flexGrow: 1 },
  justifyContentStart: { justifyContent: 'flex-start' },
  justifyContentEnd: { justifyContent: 'flex-end' },
  justifyContentCenter: { justifyContent: 'center' },
  justifyContentBetween: { justifyContent: 'space-between' },
  justifyContentAround: { justifyContent: 'space-around' },
  alignItemsStart: { alignItems: 'flex-start' },
  alignItemsEnd: { alignItems: 'flex-end' },
  alignItemsCenter: { alignItems: 'center' },
  alignItemsBaseline: { alignItems: 'baseline' },
  alignItemsStretch: { alignItems: 'stretch' },

  // Buttons
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.secondary,
  },
  btnSuccess: {
    backgroundColor: colors.success,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnWarning: {
    backgroundColor: colors.warning,
  },
  btnInfo: {
    backgroundColor: colors.info,
  },
  btnLight: {
    backgroundColor: colors.light,
  },
  btnDark: {
    backgroundColor: colors.dark,
  },
  btnOutlinePrimary: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  btnOutlineSecondary: {
    borderColor: colors.secondary,
    borderWidth: 1,
  },
  btnLg: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  btnSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 3,
  },

  // Text colors
  textPrimary: { color: colors.primary },
  textSecondary: { color: colors.secondary },
  textSuccess: { color: colors.success },
  textDanger: { color: colors.danger },
  textWarning: { color: colors.warning },
  textInfo: { color: colors.info },
  textLight: { color: colors.light },
  textDark: { color: colors.dark },
  textWhite: { color: colors.white },
  textMuted: { color: colors.muted },

  // Text alignment
  textLeft: { textAlign: 'left' },
  textCenter: { textAlign: 'center' },
  textRight: { textAlign: 'right' },

  // Text size (similar to Bootstrap's .h1, .h2, etc.)
  textH1: { fontSize: 36, fontWeight: 'bold' },
  textH2: { fontSize: 30, fontWeight: 'bold' },
  textH3: { fontSize: 24, fontWeight: 'bold' },
  textH4: { fontSize: 18, fontWeight: 'bold' },
  textH5: { fontSize: 14, fontWeight: 'bold' },
  textH6: { fontSize: 12, fontWeight: 'bold' },

  // Background colors
  bgPrimary: { backgroundColor: colors.primary },
  bgSecondary: { backgroundColor: colors.secondary },
  bgSuccess: { backgroundColor: colors.success },
  bgDanger: { backgroundColor: colors.danger },
  bgWarning: { backgroundColor: colors.warning },
  bgInfo: { backgroundColor: colors.info },
  bgLight: { backgroundColor: colors.light },
  bgDark: { backgroundColor: colors.dark },
  bgWhite: { backgroundColor: colors.white },
  bgTransparent: { backgroundColor: 'transparent' },

  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: 6,
    padding: spacer,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    paddingVertical: spacer * 0.75,
    marginBottom: spacer,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  cardBody: {
    paddingVertical: spacer * 0.5,
  },
  cardFooter: {
    paddingVertical: spacer * 0.75,
    marginTop: spacer,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },

  // Forms
  formGroup: {
    marginBottom: spacer,
  },
  formControl: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Alerts
  alert: {
    padding: spacer,
    borderRadius: 4,
    marginBottom: spacer,
  },
  alertPrimary: {
    backgroundColor: 'rgba(0, 123, 255, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  alertDanger: {
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  alertSuccess: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    borderWidth: 1,
    borderColor: colors.success,
  },

  // Border radius
  roundedNone: { borderRadius: 0 },
  roundedSm: { borderRadius: 2 },
  rounded: { borderRadius: 4 },
  roundedLg: { borderRadius: 8 },
  roundedCircle: { borderRadius: 999 },

  // Shadow
  shadowSm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  shadow: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  shadowLg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  // Widths
  w25: { width: '25%' },
  w50: { width: '50%' },
  w75: { width: '75%' },
  w100: { width: '100%' },
  wAuto: { width: 'auto' },

  // Heights
  h25: { height: '25%' },
  h50: { height: '50%' },
  h75: { height: '75%' },
  h100: { height: '100%' },
  hAuto: { height: 'auto' },
});

export default BootstrapStyles;