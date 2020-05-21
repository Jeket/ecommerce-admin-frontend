import React from 'react';
import MaterialTable from 'material-table';
import LinearProgress from '@material-ui/core/LinearProgress';
import Check from '@material-ui/icons/Check';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';
import DialogContentText from '@material-ui/core/DialogContentText';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Snackbar from '../../components/Snackbar/Snackbar';
import Card from '../../components/Card/Card';
import CardHeader from '../../components/Card/CardHeader';
import GridContainer from '../../components/Grid/GridContainer';
import GridItem from '../../components/Grid/GridItem';
import Button from '../../components/CustomButtons/Button';
import CardBody from '../../components/Card/CardBody';
import ApplicationService from '../../services/ApplicationService';

export default class CustomApplications extends React.Component {
  state = {
    applications: [],
    loading: false,
    openSnackbar: false,
    snackbarMessage: '',
    snackbarColor: '',
    openDialog: false,
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.updateVariations = this.updateVariations.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  componentDidMount() {
    this.applicationsList();
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleClose() {
    this.setState({
      openDialog: false,
    });
  }

  applicationsList() {
    this.setState({ loading: true });
    ApplicationService.getApplications()
      .then((data) => this.setState({ applications: data, loading: false }));
  }

  updateVariations(rowData) {
    ApplicationService.getApplicationSteps(rowData.productId)
      .then((data) => this.setState({ applicationSteps: data }));

    this.setState({
      openDialog: true,
      application: rowData,
    });
  }

  render() {
    const styles = {
      cardCategoryWhite: {
        '&,& a,& a:hover,& a:focus': {
          color: 'rgba(255,255,255,.62)',
          margin: '0',
          fontSize: '14px',
          marginTop: '0',
          marginBottom: '0',
        },
        '& a,& a:hover,& a:focus': {
          color: '#FFFFFF',
        },
      },
      cardTitleWhite: {
        color: '#FFFFFF',
        marginTop: '0px',
        minHeight: 'auto',
        fontWeight: '300',
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        marginBottom: '3px',
        textDecoration: 'none',
        '& small': {
          color: '#777',
          fontSize: '65%',
          fontWeight: '400',
          lineHeight: '1',
        },
      },
    };
    const detailPanel = [
      {
        tooltip: 'Details',
        render: (rowData) => (
          <div
            style={{
              width: '60%',
              backgroundColor: '#ccf9ff',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Location</TableCell>
                  <TableCell numeric>Balance</TableCell>
                  <TableCell numeric>On Hold</TableCell>
                  <TableCell numeric>Bin Code</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rowData.inventory.map((row) => (
                  <TableRow key={row.productId}>
                    <TableCell>{row.locationName}</TableCell>
                    <TableCell numeric>{row.balance}</TableCell>
                    <TableCell numeric>{row.onHoldAmount}</TableCell>
                    <TableCell>{row.binCode}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ),
      },
    ];

    const columns = [
      { title: 'Step Title', field: 'stepTitle' },
      { title: 'Step Description', field: 'stepDescription' },
      { title: 'Is Range?', field: 'isRangeValue' },
      { title: 'Min Value', field: 'minValue' },
      { title: 'Max Value', field: 'maxValue' },
      { title: 'Value Unit', field: 'valueUnit' },
      { title: 'Sort Order', field: 'sortOrder' },
      { title: 'Step Id', field: 'stepId', readonly: true },
    ];

    const {
      applications,
      loading,
      openSnackbar,
      snackbarMessage,
      snackbarColor,
      applicationSteps,
      product,
      openDialog,
    } = this.state;

    const stepsColumns = [
      { title: 'Sale Option', field: 'stepDetailTitle' },
      { title: 'Amount', field: 'amountInMainPackage', type: 'numberic' },
      { title: 'Unit Price', field: 'packagePrice', type: 'numberic' },
      {
        title: 'Step Detail Id', field: 'stepDetailId', hidden: true, readonly: true,
      },
    ];

    const options = {
      paging: true,
      pageSizeOptions: [10, 20, 50],
      pageSize: 10,
      columnsButton: true,
      exportButton: true,
      filtering: true,
      search: true,
    };

    const stepsOptions = {
      paging: false,
      columnsButton: false,
      exportButton: false,
      filtering: false,
      search: false,
    };

    return (
      <div>
        <GridContainer>
          <GridItem xs={12} sm={12} md={12}>
            <Card>
              <CardHeader color="primary">
                <div className={styles.cardTitleWhite}>Custom Applications</div>
              </CardHeader>
              <CardBody>
                <MaterialTable
                  columns={columns}
                  data={applications}
                  detailPanel={detailPanel}
                  options={options}
                  onRowClick={this.rowClicked}
                  title=""
                  actions={[
                    {
                      icon: 'attach_money',
                      tooltip: 'Variations',
                      onClick: (event, rowData) => this.updateVariations(rowData),
                    }]}
                  editable={{
                    onRowUpdate: (newData, oldData) => new Promise((resolve) => {
                      setTimeout(() => {
                        {
                          const index = applications.indexOf(oldData);
                          applications[index] = newData;
                          ApplicationService.updateApplication(newData);
                          this.setState({ applications }, () => resolve());
                        }
                        resolve();
                      }, 1000);
                    }),
                  }}
                />
              </CardBody>
            </Card>
            {loading && (<LinearProgress />)}

          </GridItem>
          <Snackbar
            place="tl"
            color={snackbarColor}
            icon={Check}
            message={snackbarMessage}
            open={openSnackbar}
            closeNotification={() => this.setState({ openSnackbar: false })}
            close
          />
        </GridContainer>
        <Dialog
          open={openDialog}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogContent>
            <DialogContentText>
              <Card>
                <CardHeader color="primary">
                  Custom Application Steps:
                </CardHeader>
                <CardBody>
                  {product && (
                    <div>
                      <Typography variant="subheading" gutterBottom>
                        Code:
                        {' '}
                        {product.productCode}
                      </Typography>
                      <Typography variant="subheading" gutterBottom>
                        Name:
                        {' '}
                        {product.productName}
                      </Typography>
                      <Typography variant="subheading" gutterBottom>
                        Sales Price ($):
                        {' '}
                        {product.salesPrice}
                      </Typography>
                    </div>
                  )}
                  <MaterialTable
                    columns={stepsColumns}
                    data={applicationSteps}
                    options={stepsOptions}
                    title=""
                    editable={{
                      onRowAdd: (newData) => new Promise((resolve) => {
                        setTimeout(() => {
                          applicationSteps.push(newData);
                          ApplicationService.createApplicationStep(product.productId, newData);
                          this.setState({ applicationSteps }, () => resolve());
                          resolve();
                        }, 1000);
                      }),
                      onRowUpdate: (newData, oldData) => new Promise((resolve) => {
                        setTimeout(() => {
                          {
                            const index = applicationSteps.indexOf(oldData);
                            applicationSteps[index] = newData;
                            ApplicationService.updateApplicationStep(product.productId, newData);
                            this.setState({ applicationSteps }, () => resolve());
                          }
                          resolve();
                        }, 1000);
                      }),
                      onRowDelete: (oldData) => new Promise((resolve) => {
                        setTimeout(() => {
                          {
                            const index = applicationSteps.indexOf(oldData);
                            applicationSteps.splice(index, 1);
                            ApplicationService.deleteApplicationStep(oldData.productId, oldData);
                            this.setState({ applicationSteps }, () => resolve());
                          }
                          resolve();
                        }, 1000);
                      }),
                    }}
                  />
                </CardBody>
              </Card>
            </DialogContentText>
            <DialogActions>
              <Button onClick={this.handleClose} color="secondary">
                Close
              </Button>
            </DialogActions>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}
