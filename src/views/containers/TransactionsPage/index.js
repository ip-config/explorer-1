// @flow

import * as React from 'react';
import Web3 from 'web3';
import { Row, Col } from 'reactstrap';

import Web3Provider from 'src/utils/DataProvider/web3Provider';
import { usePagination } from 'src/utils/hooks';
import { toFixed } from 'src/common/utility';

import { DataTable } from 'src/views/components/DataTable';
import Wrapper from 'src/views/wrapper/wrapper';
import Loader from 'src/views/components/Loader';

import type { RouterHistory } from 'react-router-dom';
import type { Transaction } from 'src/utils/types';
import { useDataProvider } from 'src/utils/DataProvider';

const transactionStructure = [
    {
        header: 'Tx Hash',
        key: 'hash',
        className: 'text-primary text-ellipsis full head',
        render: (hash: string) => (
            <span className="icon icon-transaction">
                {hash}
            </span>
        ),
    },
    {
        header: 'Block',
        key: 'blockNumber',
        className: 'text-primary text-ellipsis half',
    },
    {
        header: 'From',
        key: 'from',
        className: 'text-primary text-ellipsis half',
    },
    {
        header: 'To',
        key: 'to',
        className: 'text-primary text-ellipsis half',
    },
    {
        header: 'Value',
        key: 'value',
        className: 'half',
        render: (value: string) => {
            let newValue = '';

            if (value) {
                newValue = Web3.utils.fromWei(value, 'ether');
                newValue = toFixed(newValue, 4);

                return (<span className="o-5">{newValue} FTM</span>);
            }

            return '';
        },
    },
];

function TransactionsPage () {
    const [error, setError] = React.useState('');
    const [transactions, setTransactions] = React.useState([]);
    const [maxBlockNumber, setMaxBlockNumber] = React.useState(0);
    const [currentPage, setCurrentPage, setMaxPages] = usePagination(0, 50000);
    const provider = useDataProvider();

    const pushToTransaction = React.useCallback((history: RouterHistory, tx: Transaction) => {
        history.push({
            pathname: `/transactions/${tx.hash}`,
        })
    }, []);

    React.useEffect(() => {
        async function fetchData() {
            const response = await provider.getTransactionsPageData(currentPage * 10);

            if (response.error) {
                setError(response.error.message);
            } else {
                const { transactions, maxBlockHeight, total } = response;

                setMaxBlockNumber(maxBlockHeight);
                setMaxPages(Math.floor(total / 10));

                if (transactions) {
                    setTransactions(transactions);
                }
            }
        }

        fetchData();
    }, [currentPage, setMaxBlockNumber, provider, setMaxPages]);

    const totalBlocks = `(Total of ${maxBlockNumber} Blocks)`;
    let descriptionBlock = '';

    if (transactions.length > 0) {
        const firstBlock = transactions[0];
        const lastBlock = transactions[transactions.length - 1];

        descriptionBlock = `Transactions of Block #${lastBlock.blockNumber} To #${firstBlock.blockNumber}`;
    }

    return (
        <div>
            <Wrapper
                title="Transactions"
                onChangePage={setCurrentPage}
                block={descriptionBlock}
                total={totalBlocks}
                currentPage={currentPage}
            >
                {error ? (
                    <p className="text-white">{error}</p>
                ) : (
                    <Row>
                        <Col>
                            {
                                transactions.length > 0 ? (
                                    <DataTable
                                        data={transactions}
                                        rowKey="hash"
                                        structure={transactionStructure}
                                        historyCallback={pushToTransaction}
                                    />
                                ) : <Loader />
                            }
                        </Col>
                    </Row>
                )}
            </Wrapper>
        </div>
    );
}

export default TransactionsPage;