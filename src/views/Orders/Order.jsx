import React from 'react';
import Check from '@material-ui/icons/Check';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Chip from '@material-ui/core/Chip';
import Print from '@material-ui/icons/Print';
import Email from '@material-ui/icons/Email';
import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import CircularProgress from '@material-ui/core/CircularProgress';
import GridContainer from '../../components/Grid/GridContainer';
import Button from '../../components/CustomButtons/Button';
import Card from '../../components/Card/Card';
import CardHeader from '../../components/Card/CardHeader';
import CardBody from '../../components/Card/CardBody';
import CardFooter from '../../components/Card/CardFooter';
import Snackbar from '../../components/Snackbar/Snackbar';
import GridItem from '../../components/Grid/GridItem';
import OrderNotes from './OrderNotes';
import OrderItems from './OrderItems';
import CustomerInfo from './CustomerInfo';
import OrderService from '../../services/OrderService';
import CustomerSearch from './CustomerSearch';

const styles = {
  chip: {
    margin: 5,
  },
  smallText: {
    width: '100px',
  },
};

function dateFormat(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, 0);
  const day = `${date.getDate()}`.padStart(2, 0);
  const stringDate = [day, month, year].join('/');
  return `${stringDate} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export class Order extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      order: null,
      openSnackbar: false,
      snackbarMessage: '',
      snackbarColor: '',
      loading: false,
      openDialog: false,
      openEmailDialog: false,
      customerEmail: '',
      chequeNo: '',
      payCreditDebit: true,
      creditDebitAmount: 0,
      cashAmount: 0,
      chequeAmount: 0,
      paypalAmazonUsdAmount: 0,
      storeCreditAmount: 0,
      cashChange: 0,
      cashPaid: 0,
    };

    this.saveAsPaid = this.saveAsPaid.bind(this);
    this.saveAsHold = this.saveAsHold.bind(this);
    this.refundOrder = this.refundOrder.bind(this);
    this.emailOrder = this.emailOrder.bind(this);
    this.printOrder = this.printOrder.bind(this);
    this.packingOrder = this.packingOrder.bind(this);
    this.cancelHold = this.cancelHold.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleEmailDialogClose = this.handleEmailDialogClose.bind(this);
    this.pay = this.pay.bind(this);
    this.handleCheckChange = this.handleCheckChange.bind(this);
    this.handleEmailOrderDialog = this.handleEmailOrderDialog.bind(this);
    this.handleCashChange = this.handleCashChange.bind(this);
    this.customerChanged = this.customerChanged.bind(this);
    this.updateCustomer = this.updateCustomer.bind(this);
  }

  async componentDidMount() {
    const orderId = this.props.match.params.id;
    const order = await OrderService.getOrderDetail(orderId);
    this.setState({
      order,
      openDialog: false,
      openEmailDialog: false,
      customerEmail: order.customer.email,
      chequeNo: '',
    });
  }

  getOrderPayments() {
    const {
      payCash, payCreditDebit, payCheque, payAmazonUsd, payStoreCredit,
      cashAmount, creditDebitAmount, chequeAmount, paypalAmazonUsdAmount,
      storeCreditAmount,
      chequeNo,
    } = this.state;

    const orderPayments = [];
    if (payCash) {
      orderPayments.push({
        paymentTypeId: 22,
        paymentAmount: cashAmount,
      });
    }
    if (payCreditDebit) {
      orderPayments.push({
        paymentTypeId: 23,
        paymentAmount: creditDebitAmount,
      });
    }
    if (payCheque) {
      orderPayments.push({
        paymentTypeId: 24,
        paymentAmount: chequeAmount,
        chequeNo,
      });
    }
    if (payAmazonUsd) {
      orderPayments.push({
        paymentTypeId: 25,
        paymentAmount: paypalAmazonUsdAmount,
      });
    }
    if (payStoreCredit) {
      orderPayments.push({
        paymentTypeId: 26,
        paymentAmount: storeCreditAmount,
      });
    }
    return orderPayments;
  }

  handleEmailDialogClose = () => {
    this.setState({
      openEmailDialog: false,
    });
  }

  handleClose = () => {
    this.setState({
      openDialog: false,
    });
  }

  async updateCustomer() {
    const orderId = this.props.match.params.id;
    const { order } = this.state;
    const result = await OrderService.updateOrderCustomer(orderId, { customerId: order.customer.customerId });
    if (result) {
      this.setState({
        openSnackbar: true,
        snackbarMessage: 'Order\'s Customer was updated successfully!',
        snackbarColor: 'success',
        openDialog: false,
      });
      window.location.reload();
    }
  }

  customerChanged(customer) {
    const { order } = this.state;
    order.customer = customer;
    this.setState({
      order,
    });
  }

  handleEmailOrderDialog() {
    this.setState({
      openEmailDialog: true,
    });
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleCashChange(event) {
    const { cashAmount } = this.state;
    const cashPaid = event.target.value;
    let cashChange = 0;
    if (event.target.value && cashAmount) {
      cashChange = Number(Number(cashPaid).toFixed(2) - Number(cashAmount).toFixed(2)).toFixed(2);
    }

    this.setState({
      cashPaid,
      cashChange,
    });
  }

  handleCheckChange(event) {
    const {
      order,
      cashAmount,
      creditDebitAmount, chequeAmount, paypalAmazonUsdAmount,
      storeCreditAmount,
    } = this.state;
    const paymentAmount = (
      Number(cashAmount)
      + Number(creditDebitAmount)
      + Number(chequeAmount)
      + Number(storeCreditAmount)
      + Number(paypalAmazonUsdAmount)).toFixed(2);

    const remain = (order.total - paymentAmount).toFixed(2);
    this.setState({ [event.target.name]: event.target.checked });
    if (event.target.checked) {
      if (event.target.name === 'payCash') {
        this.setState({ cashAmount: remain });
      } else if (event.target.name === 'payCreditDebit') {
        this.setState({ creditDebitAmount: remain });
      } else if (event.target.name === 'payCheque') {
        this.setState({ chequeAmount: remain });
      } else if (event.target.name === 'payAmazonUsd') {
        this.setState({ paypalAmazonUsdAmount: remain });
      } else if (event.target.name === 'payStoreCredit') {
        this.setState({ storeCreditAmount: remain });
      }
    } else if (event.target.name === 'payCash') {
      this.setState({ cashAmount: 0 });
    } else if (event.target.name === 'payCreditDebit') {
      this.setState({ creditDebitAmount: 0 });
    } else if (event.target.name === 'payCheque') {
      this.setState({ chequeAmount: 0 });
    } else if (event.target.name === 'payAmazonUsd') {
      this.setState({ paypalAmazonUsdAmount: 0 });
    } else if (event.target.name === 'payStoreCredit') {
      this.setState({ storeCreditAmount: 0 });
    }
  }

  async updateOrderStatus(orderStatus) {
    this.setState({
      loading: true,
    });

    const { order } = this.state;
    let orderPayment = [];
    if (orderStatus === 'Paid') {
      const {
        payStoreCredit,
        storeCreditAmount,
      } = this.state;
      if (payStoreCredit && storeCreditAmount > order.customer.storeCredit) {
        this.setState({
          openSnackbar: true,
          snackbarMessage: `Customer Store Credit ${order.customer.storeCredit}, is less than Store Credit Specified : ${storeCreditAmount}!`,
          snackbarColor: 'danger',
        });
        return false;
      }

      orderPayment = this.getOrderPayments();
    }

    const result = await OrderService.updateOrderStatus(order.orderId, { orderStatus, orderPayment });
    if (result === false || result === null || result.StatusCode === 500 || result.StatusCode === 400) {
      this.setState({
        openSnackbar: true,
        loading: false,
        snackbarMessage: 'Oops, looks like something went wrong!',
        snackbarColor: 'danger',
      });
      return false;
    }

    this.setState({
      loading: false,
    });

    return result;
  }

  async refundOrder() {
    const { match, history } = this.props;
    const orderId = match.params.id;
    history.push(`/return/${orderId}`);
  }

  async emailOrder() {
    const { order, customerEmail } = this.state;
    this.setState({
      loading: true,
      openEmailDialog: false,
    });
    await OrderService.emailOrder(order.orderId, customerEmail);
    this.setState({
      loading: false,
    });
  }

  async printOrder() {
    const { order } = this.state;
    this.setState({
      loading: true,
    });
    await OrderService.printOrder(order.orderId);
    this.setState({
      loading: false,
    });
  }

  async packingOrder() {
    const { order } = this.state;
    this.setState({
      loading: true,
    });
    await OrderService.packingOrder(order.orderId);
    this.setState({
      loading: false,
    });
  }

  async saveAsPaid() {
    const { order } = this.state;
    this.setState({
      openDialog: true,
      creditDebitAmount: order.total.toFixed(2),
    });
  }

  async pay() {
    const {
      order, cashAmount, creditDebitAmount, chequeAmount, paypalAmazonUsdAmount, storeCreditAmount,
    } = this.state;
    const paidAmount = Number(cashAmount) + Number(creditDebitAmount) + Number(chequeAmount) + Number(storeCreditAmount) + Number(paypalAmazonUsdAmount);
    if ((Number(paidAmount)).toFixed(2) !== (Number(order.total)).toFixed(2)) {
      this.setState({
        openSnackbar: true,
        snackbarMessage: `Total Paid Amount: ${paidAmount.toFixed(2)} $, must be the same as Order Total:${order.total.toFixed(2)} $`,
        snackbarColor: 'danger',
      });
      return;
    }

    const status = 'Paid';
    const result = await this.updateOrderStatus(status);
    if (result && result.orderId) {
      this.setState({
        openSnackbar: true,
        snackbarMessage: 'Order was marked as Paid successfully!',
        snackbarColor: 'success',
        openDialog: false,
      });

      window.location.reload();
    }
  }

  async saveAsHold() {
    const status = 'OnHold';
    const result = await this.updateOrderStatus(status);
    if (result && result.orderId) {
      this.setState({
        openSnackbar: true,
        snackbarMessage: 'Order was marked as On-Hold successfully!',
        snackbarColor: 'success',
      });
      const { order } = this.state;
      order.status = status;
      this.setState({
        order,
      });
    }
  }

  async cancelHold() {
    const status = 'Draft';
    const result = await this.updateOrderStatus(status);
    if (result && result.orderId) {
      this.setState({
        openSnackbar: true,
        snackbarMessage: 'Order was marked as Draft and not On-Hold any more!',
        snackbarColor: 'success',
      });
      const { order } = this.state;
      order.status = status;
      this.setState({
        order,
      });
    }
  }

  render() {
    const {
      order, openSnackbar, snackbarMessage, snackbarColor, loading,
      openDialog,
      openEmailDialog,
      customerEmail,
      chequeNo,
      payCash,
      payCheque,
      payCreditDebit,
      payAmazonUsd,
      payStoreCredit,
      cashAmount,
      chequeAmount,
      creditDebitAmount,
      paypalAmazonUsdAmount,
      storeCreditAmount,
      cashChange,
      cashPaid,
    } = this.state;

    return (
      <div>
        { order && (
        <div>
          <GridContainer>
            <GridItem xs={12} sm={12} md={12}>
              <Card>
                <CardHeader color="primary">
                  <div>
                  Order #
                  &nbsp;
                    <b>{order.orderId}</b>
                    {dateFormat(order.orderDate)}
                    <Chip label={order.status} color="primary" />
                  </div>
                </CardHeader>
                <CardBody>
                  <GridContainer>
                    <GridItem>
                      <GridContainer>
                        <GridItem>
                          <Button color="warning" disabled={loading} onClick={this.handleEmailOrderDialog}>
                            <Email />
                          &nbsp;
                          Email
                          </Button>
                        </GridItem>
                        <GridItem>
                          <Button color="warning" disabled={loading} onClick={this.printOrder}>
                            <Print />
                          &nbsp;
                          Print
                          </Button>
                        </GridItem>

                        { (order.status === 'Account' || order.status === 'Paid')
                        && (
                        <GridItem>
                          <Button color="warning" disabled={loading} onClick={this.packingOrder}>
                            <Print />
                              &nbsp;
                              Packing Slip
                          </Button>
                        </GridItem>
                        )}

                        { order.status === 'Draft' || order.status === 'OnHold' || order.status === 'Account'
                          ? (
                            <GridItem xs>
                              <Button color="info" onClick={this.saveAsPaid}>Mark As Paid</Button>
                            </GridItem>
                          ) : <div />}

                        { order.status === 'Draft' && (
                        <GridItem xs>
                          <Button color="info" onClick={this.saveAsHold}>Put On Hold</Button>
                        </GridItem>
                        )}

                        { order.status === 'Paid' && (
                        <GridItem xs>
                          <Button color="info" onClick={this.refundOrder}>Return</Button>
                        </GridItem>
                        )}

                        { order.status === 'OnHold' && (
                        <GridItem xs>
                          <Button color="info" onClick={this.cancelHold}>Cancel On Hold</Button>
                        </GridItem>
                        )}
                        <GridItem xs>
                          { loading && <CircularProgress /> }
                        </GridItem>
                      </GridContainer>
                    </GridItem>
                    <GridItem xs={12}>
                      <OrderItems order={order} />
                    </GridItem>
                    <GridItem xs={8}>
                      <GridContainer>
                        <GridItem xs={12}>
                          <CustomerInfo customer={order.customer} />
                        </GridItem>
                        <GridItem xs={9}>
                          {order.status === 'Draft' && (
                          <CustomerSearch customerChanged={this.customerChanged} />
                          )}
                        </GridItem>
                        <GridItem xs={3}>
                          {order.status === 'Draft' && (
                            <Button color="info" onClick={this.updateCustomer}>Update Customer</Button>
                          )}
                        </GridItem>
                      </GridContainer>
                    </GridItem>
                    <GridItem xs={4}>
                      <OrderNotes order={order} />
                    </GridItem>
                  </GridContainer>
                </CardBody>
                <CardFooter />
              </Card>
              <Snackbar
                place="tl"
                color={snackbarColor}
                icon={Check}
                message={snackbarMessage}
                open={openSnackbar}
                closeNotification={() => this.setState({ openSnackbar: false })}
                close
              />
            </GridItem>
          </GridContainer>
          <Dialog
            open={openDialog}
            onClose={this.handleClose}
            aria-labelledby="form-dialog-title"
          >
            <DialogContent>
              <Card>
                <CardHeader color="info">
                  <div>Select Payment Option</div>
                </CardHeader>
                <CardBody>
                  <FormControl component="fieldset">
                    <GridContainer>
                      <GridItem md={3}>
                        <FormControlLabel
                          control={(
                            <Checkbox
                              name="payCash"
                              checked={payCash}
                              onChange={this.handleCheckChange}
                              value="payCash"
                            />
                            )}
                          label="Cash"
                        />
                      </GridItem>
                      <GridItem md={3}>
                        <TextField
                          disabled={!payCash}
                          name="cashAmount"
                          label="Cash Amount"
                          type="text"
                          onChange={this.handleChange}
                          style={styles.smallText}
                          value={cashAmount}
                        />
                      </GridItem>
                      <GridItem md={3}>
                        <TextField
                          disabled={!payCash}
                          name="cashPaid"
                          label="Bills Paid"
                          type="text"
                          onChange={this.handleCashChange}
                          style={styles.smallText}
                          value={cashPaid}
                        />
                      </GridItem>
                      <GridItem md={3}>
                        <TextField
                          disabled
                          name="cashChange"
                          label="Change"
                          type="text"
                          style={styles.smallText}
                          value={cashChange}
                        />
                      </GridItem>
                      <GridItem md={6}>
                        <FormControlLabel
                          control={(
                            <Checkbox
                              checked={payCreditDebit}
                              onChange={this.handleCheckChange}
                              name="payCreditDebit"
                              value="payCreditDebit"
                            />
                            )}
                          label="Credit Card / Debit"
                        />
                      </GridItem>
                      <GridItem md={6}>
                        <TextField
                          disabled={!payCreditDebit}
                          name="creditDebitAmount"
                          label="Credit/Debit Amount"
                          type="text"
                          onChange={this.handleChange}
                          value={creditDebitAmount}
                        />
                      </GridItem>
                      <GridItem md={6}>
                        <FormControlLabel
                          control={(
                            <Checkbox
                              checked={payCheque}
                              onChange={this.handleCheckChange}
                              value="payCheque"
                              name="payCheque"
                            />
                            )}
                          label="Cheque"
                        />
                        {payCheque && (
                        <TextField
                          name="chequeNo"
                          label="Cheque Number"
                          type="text"
                          onChange={this.handleChange}
                          value={chequeNo}
                        />
                        )}
                      </GridItem>
                      <GridItem md={6}>
                        <TextField
                          disabled={!payCheque}
                          name="chequeAmount"
                          label="Cheque Amount"
                          type="text"
                          onChange={this.handleChange}
                          value={chequeAmount}
                        />
                      </GridItem>
                      <GridItem md={6}>
                        <FormControlLabel
                          control={(
                            <Checkbox
                              checked={payAmazonUsd}
                              onChange={this.handleCheckChange}
                              value="payAmazonUsd"
                              name="payAmazonUsd"
                            />
                            )}
                          label="Paypal and Amazon + USD"
                        />
                      </GridItem>
                      <GridItem md={6}>
                        <TextField
                          disabled={!payAmazonUsd}
                          name="paypalAmazonUsdAmount"
                          label="Paypal/Amazon/USD"
                          type="text"
                          onChange={this.handleChange}
                          value={paypalAmazonUsdAmount}
                        />
                      </GridItem>
                      <GridItem md={6}>
                        <FormControlLabel
                          control={(
                            <Checkbox
                              disabled={!order.customer || order.customer.storeCredit <= 0}
                              checked={payStoreCredit}
                              onChange={this.handleCheckChange}
                              value="payStoreCredit"
                              name="payStoreCredit"
                            />
                          )}
                          label="Store Credit"
                        />
                      </GridItem>
                      <GridItem md={6}>
                        <TextField
                          disabled={!payStoreCredit}
                          name="storeCreditAmount"
                          label="Store Credit"
                          type="text"
                          onChange={this.handleChange}
                          value={storeCreditAmount}
                        />
                      </GridItem>
                      <GridItem md={12}>
                        <br />
                        <hr />
                      </GridItem>
                      <GridItem md={6}>
                        <h5>Total Payment:</h5>
                      </GridItem>
                      <GridItem md={6}>
                        <h5>
                          {
                              (Number(cashAmount)
                              + Number(creditDebitAmount)
                              + Number(chequeAmount)
                              + Number(storeCreditAmount)
                              + Number(paypalAmazonUsdAmount)).toFixed(2)}
                          {' '}
$
                        </h5>
                      </GridItem>
                      <GridItem md={6}>
                        <h5>Amount Due:</h5>
                      </GridItem>
                      <GridItem md={6}>
                        <h5>
                          {order.total && order.total.toFixed(2)}
                          {' '}
$
                        </h5>
                      </GridItem>
                    </GridContainer>
                  </FormControl>
                </CardBody>
              </Card>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleClose} color="info">
                  Cancel
              </Button>
              <Button onClick={this.pay} color="primary">
                  Pay
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={openEmailDialog}
            onClose={this.handleEmailDialogClose}
            aria-labelledby="form-dialog-title"
          >
            <DialogContent>
              <Card>
                <CardHeader color="info">
                  <div>Invoice Email</div>
                </CardHeader>
                <CardBody>
                  <FormControl component="fieldset">
                    <TextField
                      required
                      name="customerEmail"
                      label="Customer Email"
                      type="text"
                      onChange={this.handleChange}
                      fullWidth
                      value={customerEmail}
                    />
                  </FormControl>
                </CardBody>
              </Card>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleEmailDialogClose} color="info">
              Cancel
              </Button>
              <Button onClick={this.emailOrder} color="primary">
              Send
              </Button>
            </DialogActions>
          </Dialog>
        </div>
        ) }
      </div>
    );
  }
}

Order.propTypes = {
  // classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Order);
